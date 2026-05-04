import { sendPromptStream } from "./chat"
import type { RuntimeRequest, RuntimeResponse } from "./types"

async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = []
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString("utf8")
}

function writeLine(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`)
}

async function main() {
  const input = await readStdin()
  const request = JSON.parse(input) as RuntimeRequest

  try {
    if (request.method !== "send_prompt") {
      throw new Error(`Unsupported stream command: ${request.method}`)
    }

    let finalResult: unknown = null
    await sendPromptStream(request.params as never, (event) => {
      writeLine({ id: request.id, event })
      if (event.type === "completed" || event.type === "failed") {
        finalResult = event.session
      }
    })

    const response: RuntimeResponse = {
      id: request.id,
      ok: true,
      result: finalResult,
    }
    writeLine(response)
  } catch (error) {
    const response: RuntimeResponse = {
      id: request.id,
      ok: false,
      error: error instanceof Error ? error.message : "Runtime stream command failed.",
    }
    writeLine(response)
  }
}

await main()
