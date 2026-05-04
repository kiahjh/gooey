import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

export async function readJson<T>(path: string): Promise<T> {
  const contents = await readFile(path, "utf8")
  return JSON.parse(contents) as T
}

export async function readJsonOrDefault<T>(path: string, fallback: T): Promise<T> {
  try {
    return await readJson<T>(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return fallback
    throw error
  }
}

export async function writeJson(path: string, value: unknown, mode?: number): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    mode,
  })
}
