import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

export const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))

export function gooeyHome(): string {
  return process.env.GOOEY_HOME ?? join(process.env.HOME ?? ".", ".gooey")
}

export function workspaceRoot(): string {
  return join(gooeyHome(), "workspaces")
}

export function indexFile(): string {
  return join(gooeyHome(), "workspaces.json")
}

export function authFile(): string {
  return join(gooeyHome(), "auth.json")
}

export function workspaceDir(workspaceId: string): string {
  return join(workspaceRoot(), workspaceId)
}

export function workspaceFile(workspaceId: string): string {
  return join(workspaceDir(workspaceId), "workspace.json")
}

export function sessionsDir(workspaceId: string): string {
  return join(workspaceDir(workspaceId), "sessions")
}

export function sessionFile(workspaceId: string, sessionId: string): string {
  return join(sessionsDir(workspaceId), `${sessionId}.json`)
}
