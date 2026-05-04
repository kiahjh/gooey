import { dispatchRuntimeCommand } from "./commands"
import type { RuntimeRequest, RuntimeResponse } from "./types"

async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = []
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString("utf8")
}

async function main() {
  const input = await readStdin()
  const request = JSON.parse(input) as RuntimeRequest
  let response: RuntimeResponse

  try {
    const result = await dispatchRuntimeCommand(request.method, request.params)
    response = {
      id: request.id,
      ok: true,
      result,
    }
  } catch (error) {
    response = {
      id: request.id,
      ok: false,
      error: error instanceof Error ? error.message : "Runtime command failed.",
    }
  }

  process.stdout.write(JSON.stringify(response))
}

await main()
