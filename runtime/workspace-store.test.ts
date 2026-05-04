import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  addWorkspace,
  archiveSession,
  createSession,
  getSidebarState,
  selectSession,
} from "./workspace-store"

let home: string
let projectRoot: string

beforeEach(async () => {
  home = await mkdtemp(join(tmpdir(), "gooey-runtime-home-"))
  projectRoot = await mkdtemp(join(tmpdir(), "gooey-runtime-project-"))
  process.env.GOOEY_HOME = home
})

afterEach(async () => {
  delete process.env.GOOEY_HOME
  await rm(home, { force: true, recursive: true })
  await rm(projectRoot, { force: true, recursive: true })
})

describe("workspace store", () => {
  test("persists workspaces and sessions", async () => {
    const firstSnapshot = await addWorkspace(projectRoot)
    expect(firstSnapshot.workspaces).toHaveLength(1)
    expect(firstSnapshot.activeWorkspaceId).toBe(firstSnapshot.workspaces[0].id)

    const secondSnapshot = await createSession(firstSnapshot.workspaces[0].id)
    expect(secondSnapshot.workspaces[0].sessions).toHaveLength(1)
    expect(secondSnapshot.activeSessionId).toBe(secondSnapshot.workspaces[0].sessions[0].id)

    const reloadedSnapshot = await getSidebarState()
    expect(reloadedSnapshot.workspaces).toHaveLength(1)
    expect(reloadedSnapshot.workspaces[0].sessions).toHaveLength(1)
    expect(reloadedSnapshot.activeSessionId).toBe(secondSnapshot.activeSessionId)
  })

  test("selecting a session does not reorder workspaces", async () => {
    const alpha = await mkdtemp(join(tmpdir(), "gooey-alpha-"))
    const beta = await mkdtemp(join(tmpdir(), "gooey-beta-"))

    try {
      const firstSnapshot = await addWorkspace(alpha)
      const secondSnapshot = await addWorkspace(beta)
      await createSession(firstSnapshot.workspaces[0].id)
      const withSecondSession = await createSession(secondSnapshot.workspaces[1].id)
      const selectedSnapshot = await selectSession(withSecondSession.workspaces[1].sessions[0].id)

      expect(selectedSnapshot.workspaces).toHaveLength(2)
      expect(selectedSnapshot.workspaces[0].path).toBe(firstSnapshot.workspaces[0].path)
      expect(selectedSnapshot.workspaces[1].path).toBe(secondSnapshot.workspaces[1].path)
      expect(selectedSnapshot.activeWorkspaceId).toBe(withSecondSession.workspaces[1].id)
    } finally {
      await rm(alpha, { force: true, recursive: true })
      await rm(beta, { force: true, recursive: true })
    }
  })

  test("archiving hides a session from the sidebar", async () => {
    const workspaceSnapshot = await addWorkspace(projectRoot)
    const createdSnapshot = await createSession(workspaceSnapshot.workspaces[0].id)
    const sessionId = createdSnapshot.workspaces[0].sessions[0].id

    const archivedSnapshot = await archiveSession(sessionId)

    expect(archivedSnapshot.workspaces[0].sessions).toHaveLength(0)
  })
})
