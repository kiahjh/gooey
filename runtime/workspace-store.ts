import { mkdir, readdir, realpath, stat } from "node:fs/promises"
import { basename } from "node:path"
import {
  indexFile,
  sessionFile,
  sessionsDir,
  workspaceDir,
  workspaceFile,
  workspaceRoot,
} from "./paths"
import { readJson, readJsonOrDefault, writeJson } from "./json-store"
import type {
  Session,
  SidebarStateSnapshot,
  WorkspaceIndex,
  WorkspaceRecord,
} from "./types"

const defaultIndex = (): WorkspaceIndex => ({
  activeSessionId: null,
  activeWorkspaceId: null,
  workspaces: [],
})

export async function getSidebarState(): Promise<SidebarStateSnapshot> {
  const index = await loadIndex()
  await normalizeSessionStatusesToIdle(index)

  const workspaces = await Promise.all(
    index.workspaces.map(async (workspace) => {
      const sessions = (await loadSessionsForWorkspace(workspace.id))
        .filter((session) => !session.archived)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

      return { ...workspace, sessions }
    }),
  )

  if (!index.activeWorkspaceId) {
    index.activeWorkspaceId = workspaces[0]?.id ?? null
  }

  if (index.activeWorkspaceId) {
    const activeWorkspace = workspaces.find(
      (workspace) => workspace.id === index.activeWorkspaceId,
    )
    const activeSessionExists =
      activeWorkspace?.sessions.some(
        (session) => session.id === index.activeSessionId,
      ) ?? false

    if (!activeSessionExists) index.activeSessionId = null
  }

  await saveIndex(index)

  return {
    activeSessionId: index.activeSessionId,
    activeWorkspaceId: index.activeWorkspaceId,
    workspaces,
  }
}

export async function addWorkspace(path: string): Promise<SidebarStateSnapshot> {
  const canonicalPath = await realpath(path)
  const pathStats = await stat(canonicalPath)
  if (!pathStats.isDirectory()) throw new Error("Selected path is not a directory.")

  const now = timestamp()
  const index = await loadIndex()
  const existingWorkspace = index.workspaces.find(
    (workspace) => workspace.path === canonicalPath,
  )

  if (existingWorkspace) {
    existingWorkspace.updatedAt = now
    existingWorkspace.lastOpenedAt = now
    index.activeWorkspaceId = existingWorkspace.id
    index.activeSessionId = await latestSessionId(existingWorkspace.id)
    await writeWorkspaceRecord(existingWorkspace)
    await saveIndex(index)
    return getSidebarState()
  }

  const workspace: WorkspaceRecord = {
    id: id("ws"),
    name: basename(canonicalPath) || canonicalPath,
    path: canonicalPath,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  }

  index.activeWorkspaceId = workspace.id
  index.activeSessionId = null
  index.workspaces.push(workspace)

  await createWorkspaceDirs(workspace.id)
  await writeWorkspaceRecord(workspace)
  await saveIndex(index)
  return getSidebarState()
}

export async function createSession(workspaceId: string): Promise<SidebarStateSnapshot> {
  const index = await loadIndex()
  const workspace = index.workspaces.find((candidate) => candidate.id === workspaceId)
  if (!workspace) throw new Error("Workspace not found.")

  const now = timestamp()
  const session: Session = {
    id: id("ses"),
    workspaceId: workspace.id,
    title: "Untitled",
    status: "idle",
    archived: false,
    createdAt: now,
    updatedAt: now,
    events: [],
  }

  workspace.updatedAt = now
  workspace.lastOpenedAt = now
  index.activeWorkspaceId = workspace.id
  index.activeSessionId = session.id

  await writeWorkspaceRecord(workspace)
  await writeSessionRecord(session)
  await saveIndex(index)
  return getSidebarState()
}

export async function selectSession(sessionId: string): Promise<SidebarStateSnapshot> {
  const index = await loadIndex()
  let workspaceId: string | null = null

  for (const workspace of index.workspaces) {
    const sessions = await loadSessionsForWorkspace(workspace.id)
    if (sessions.some((session) => session.id === sessionId)) {
      workspaceId = workspace.id
      break
    }
  }

  if (!workspaceId) throw new Error("Session not found.")

  index.activeWorkspaceId = workspaceId
  index.activeSessionId = sessionId
  await saveIndex(index)
  return getSidebarState()
}

export async function archiveSession(sessionId: string): Promise<SidebarStateSnapshot> {
  const index = await loadIndex()
  const now = timestamp()
  let archivedWorkspaceId: string | null = null
  let archivedActiveSession = false

  for (const workspace of index.workspaces) {
    const sessions = await loadSessionsForWorkspace(workspace.id)
    const session = sessions.find((candidate) => candidate.id === sessionId)
    if (!session) continue

    session.archived = true
    session.updatedAt = now
    workspace.updatedAt = now
    archivedWorkspaceId = workspace.id
    archivedActiveSession = index.activeSessionId === session.id

    await writeSessionRecord(session)
    await writeWorkspaceRecord(workspace)
    break
  }

  if (!archivedWorkspaceId) throw new Error("Session not found.")
  if (archivedActiveSession) {
    index.activeSessionId = await latestSessionId(archivedWorkspaceId)
  }
  if (index.activeWorkspaceId === archivedWorkspaceId && !index.activeSessionId) {
    index.activeWorkspaceId = archivedWorkspaceId
  }

  await saveIndex(index)
  return getSidebarState()
}

export async function getSession(sessionId: string): Promise<Session> {
  const index = await loadIndex()

  for (const workspace of index.workspaces) {
    const sessions = await loadSessionsForWorkspace(workspace.id)
    const session = sessions.find((candidate) => candidate.id === sessionId)
    if (session) return session
  }

  throw new Error("Session not found.")
}

export async function updateSession(session: Session): Promise<void> {
  await writeSessionRecord(session)
}

export async function touchWorkspace(workspaceId: string): Promise<void> {
  const index = await loadIndex()
  const workspace = index.workspaces.find((candidate) => candidate.id === workspaceId)
  if (!workspace) return

  workspace.updatedAt = timestamp()
  workspace.lastOpenedAt = workspace.updatedAt
  await writeWorkspaceRecord(workspace)
  await saveIndex(index)
}

export async function loadIndex(): Promise<WorkspaceIndex> {
  return readJsonOrDefault(indexFile(), defaultIndex())
}

export async function saveIndex(index: WorkspaceIndex): Promise<void> {
  await writeJson(indexFile(), index)
}

export async function loadSessionsForWorkspace(workspaceId: string): Promise<Session[]> {
  try {
    const entries = await readdir(sessionsDir(workspaceId), { withFileTypes: true })
    const sessions = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => readJson<Session>(sessionFile(workspaceId, entry.name.slice(0, -5)))),
    )
    return sessions
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return []
    throw error
  }
}

function writeWorkspaceRecord(workspace: WorkspaceRecord): Promise<void> {
  return writeJson(workspaceFile(workspace.id), workspace)
}

function writeSessionRecord(session: Session): Promise<void> {
  return writeJson(sessionFile(session.workspaceId, session.id), session)
}

async function normalizeSessionStatusesToIdle(index: WorkspaceIndex): Promise<void> {
  for (const workspace of index.workspaces) {
    const sessions = await loadSessionsForWorkspace(workspace.id)
    const changedSessions = sessions.filter((session) => session.status !== "idle")
    for (const session of changedSessions) {
      session.status = "idle"
      await writeSessionRecord(session)
    }
  }
}

async function latestSessionId(workspaceId: string): Promise<string | null> {
  const sessions = (await loadSessionsForWorkspace(workspaceId)).filter(
    (session) => !session.archived,
  )
  sessions.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  return sessions[0]?.id ?? null
}

async function createWorkspaceDirs(workspaceId: string): Promise<void> {
  await mkdir(workspaceRoot(), { recursive: true })
  await mkdir(workspaceDir(workspaceId), { recursive: true })
  await mkdir(sessionsDir(workspaceId), { recursive: true })
}

export function timestamp(): string {
  return new Date().toISOString()
}

export function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`
}
