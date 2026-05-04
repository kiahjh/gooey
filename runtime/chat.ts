import { getOpenAIAccess } from "./provider-auth"
import { getSession, id, timestamp, touchWorkspace, updateSession } from "./workspace-store"
import type { SendPromptInput, Session, SessionEvent } from "./types"

const CODEX_API_ENDPOINT = "https://chatgpt.com/backend-api/codex/responses"

type ResponsesOutputPart = {
  text?: string
  type?: string
}

type ResponsesOutput = {
  content?: ResponsesOutputPart[]
  type?: string
}

type ResponsesResult = {
  output?: ResponsesOutput[]
  output_text?: string
}

export type PromptStreamEvent =
  | {
      type: "session"
      session: Session
    }
  | {
      type: "assistant_delta"
      delta: string
      runId: string
      sequenceNumber: number | null
      sessionId: string
    }
  | {
      type: "completed"
      session: Session
    }
  | {
      type: "failed"
      session: Session
    }

export async function sendPrompt(input: SendPromptInput) {
  let completedSession: Session | null = null
  await sendPromptStream(input, (event) => {
    if (event.type === "completed" || event.type === "failed") {
      completedSession = event.session
    }
  })

  if (!completedSession) throw new Error("The chat request did not complete.")
  return completedSession
}

export async function sendPromptStream(
  input: SendPromptInput,
  emit: (event: PromptStreamEvent) => void,
) {
  const prompt = input.prompt.trim()
  if (!prompt) throw new Error("Type a message before sending.")

  const session = await getSession(input.sessionId)
  const runId = id("run")
  const now = timestamp()
  const userEvent: SessionEvent = {
    id: id("evt"),
    type: "user",
    createdAt: now,
    text: prompt,
  }

  session.events.push(userEvent)
  session.status = "working"
  session.updatedAt = now
  if (session.title === "Untitled") session.title = titleFromPrompt(prompt)
  await updateSession(session)
  emit({ type: "session", session })

  try {
    const assistantText = await runPlainOpenAIChat({
      onDelta: (delta, sequenceNumber) => {
        emit({
          type: "assistant_delta",
          delta,
          runId,
          sequenceNumber,
          sessionId: session.id,
        })
      },
      modelId: input.modelId,
      messages: session.events,
      runId,
    })
    const completedAt = timestamp()
    session.events.push({
      id: id("evt"),
      type: "assistant",
      createdAt: completedAt,
      model: input.modelId,
      provider: "openai",
      runId,
      text: assistantText,
    })
    session.status = "idle"
    session.updatedAt = completedAt
    await updateSession(session)
    await touchWorkspace(session.workspaceId)
    emit({ type: "completed", session })
  } catch (error) {
    const failedAt = timestamp()
    session.events.push({
      id: id("evt"),
      type: "system",
      createdAt: failedAt,
      level: "error",
      runId,
      text: error instanceof Error ? error.message : "The chat request failed.",
    })
    session.status = "idle"
    session.updatedAt = failedAt
    await updateSession(session)
    await touchWorkspace(session.workspaceId)
    emit({ type: "failed", session })
  }
}

async function runPlainOpenAIChat({
  messages,
  modelId,
  onDelta,
}: {
  messages: SessionEvent[]
  modelId: string
  onDelta?: (delta: string, sequenceNumber: number | null) => void
  runId: string
}): Promise<string> {
  const auth = await getOpenAIAccess()
  const model = modelId.replace(/^openai\//, "")
  const response = await fetch(CODEX_API_ENDPOINT, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${auth.access}`,
      "content-type": "application/json",
      "originator": "gooey",
      "user-agent": `gooey/0.1.0 (${process.platform}; ${process.arch})`,
      ...(auth.accountId ? { "ChatGPT-Account-Id": auth.accountId } : {}),
    },
    body: JSON.stringify({
      model,
      instructions: "",
      input: messages.flatMap((event) => {
        if (event.type === "user") {
          return [{ role: "user", content: event.text }]
        }
        if (event.type === "assistant") {
          return [{ role: "assistant", content: event.text }]
        }
        return []
      }),
      stream: true,
      store: false,
      tools: [],
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(
      `OpenAI request failed with status ${response.status}${text ? `: ${text.slice(0, 240)}` : ""}`,
    )
  }

  const text = await readResponseStreamText(response, onDelta)
  if (!text) throw new Error("OpenAI returned an empty response.")
  return text
}

async function readResponseStreamText(
  response: Response,
  onDelta?: (delta: string, sequenceNumber: number | null) => void,
): Promise<string> {
  if (response.body) {
    return readLiveResponseStreamText(response.body, onDelta)
  }

  const streamText = await response.text()
  let output = ""

  for (const eventChunk of streamText.split("\n\n")) {
    const eventName = eventChunk
      .split("\n")
      .find((line) => line.startsWith("event: "))
      ?.slice("event: ".length)
    const data = eventChunk
      .split("\n")
      .find((line) => line.startsWith("data: "))
      ?.slice("data: ".length)

    if (!data || eventName !== "response.output_text.delta") continue

    try {
      const parsed = JSON.parse(data) as {
        delta?: string
        sequence_number?: number
      }
      const delta = parsed.delta ?? ""
      output += delta
      if (delta) onDelta?.(delta, parsed.sequence_number ?? null)
    } catch {
      // Ignore malformed stream fragments and keep any valid deltas.
    }
  }

  if (output.trim()) return output.trim()

  for (const eventChunk of streamText.split("\n\n").reverse()) {
    const data = eventChunk
      .split("\n")
      .find((line) => line.startsWith("data: "))
      ?.slice("data: ".length)
    if (!data) continue

    try {
      const parsed = JSON.parse(data) as ResponsesResult
      const text = extractResponseText(parsed)
      if (text) return text
    } catch {
      // Continue searching for a final response-shaped event.
    }
  }

  return ""
}

async function readLiveResponseStreamText(
  body: ReadableStream<Uint8Array>,
  onDelta?: (delta: string, sequenceNumber: number | null) => void,
): Promise<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let output = ""
  let finalResponseText = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split("\n\n")
    buffer = chunks.pop() ?? ""

    for (const chunk of chunks) {
      const parsed = parseStreamChunk(chunk)
      if (!parsed) continue

      if (parsed.eventName === "response.output_text.delta") {
        const data = parsed.data as {
          delta?: string
          sequence_number?: number
        }
        const delta = data.delta ?? ""
        output += delta
        if (delta) onDelta?.(delta, data.sequence_number ?? null)
      } else {
        const text = extractResponseText(parsed.data as ResponsesResult)
        if (text) finalResponseText = text
      }
    }
  }

  if (buffer.trim()) {
    const parsed = parseStreamChunk(buffer)
    if (parsed?.eventName === "response.output_text.delta") {
      const data = parsed.data as {
        delta?: string
        sequence_number?: number
      }
      const delta = data.delta ?? ""
      output += delta
      if (delta) onDelta?.(delta, data.sequence_number ?? null)
    }
  }

  return output.trim() || finalResponseText
}

function parseStreamChunk(chunk: string): { eventName: string; data: unknown } | null {
  const eventName = chunk
    .split("\n")
    .find((line) => line.startsWith("event: "))
    ?.slice("event: ".length)
  const data = chunk
    .split("\n")
    .find((line) => line.startsWith("data: "))
    ?.slice("data: ".length)

  if (!eventName || !data) return null

  try {
    return { eventName, data: JSON.parse(data) as unknown }
  } catch {
    return null
  }
}

function extractResponseText(result: ResponsesResult): string {
  if (typeof result.output_text === "string") return result.output_text

  return (
    result.output
      ?.flatMap((item) => item.content ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim() ?? ""
  )
}

function titleFromPrompt(prompt: string): string {
  const collapsed = prompt.replace(/\s+/g, " ").trim()
  if (collapsed.length <= 42) return collapsed
  return `${collapsed.slice(0, 39).trimEnd()}...`
}
