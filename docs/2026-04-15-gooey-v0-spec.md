# Gooey v0 Spec

## Status
Draft

## Purpose
This document translates the Gooey vision into a concrete **v0**: the smallest version that is actually usable, reflects the product thesis, and creates the right architectural seam for future extensibility.

v0 is **not** the full Gooey vision. It is a thin but correct first version.

---

## One-sentence definition
Gooey v0 is a local-first macOS Tauri app for running agent conversations against project folders, with multiple workspaces and sessions, a TypeScript harness runtime, OpenAI support, four built-in coding tools (`read`, `bash`, `edit`, `write`), and persistence under `~/.gooey`.

---

## Goals

### Product goals
- Make Gooey feel like a **real workbench**, not a toy chat demo.
- Support **multiple project workspaces** and **multiple named sessions** per workspace.
- Keep the default UI **minimal, sparse, and calm**.
- Make agent behavior **visibly inspectable** via inline tool activity.
- Keep all persistence **local-first** and stored in `~/.gooey`.

### Architectural goals
- Keep the **backend** as the source of truth for sessions and execution.
- Implement the harness/runtime in **TypeScript** so Gooey can naturally evolve toward TS-based customization and extensions.
- Introduce a **provider abstraction** from the start, even though only one real provider ships in v0.
- Shape the codebase for future extensibility without requiring a user-facing extension system yet.

---

## Non-goals
- No user-facing extension API yet.
- No custom panels, layout plugins, or UI extension loading.
- No session branching/tree model.
- No permission prompts or approval flows.
- No project-local `.gooey` config in v0.
- No built-in theme system beyond whatever the default app styling requires.
- No advanced memory system.
- No automatic project indexing, embeddings, or preload scanning.
- No provider marketplace or many-provider UX.

---

## Target user
Solo developers using Gooey as a local coding workbench.

---

## Core user experience

### Primary layout
Gooey v0 uses the default workbench layout described in the vision:
- **Left sidebar**
  - workspace list
  - sessions within the selected workspace
- **Main pane**
  - transcript for the active session
  - inline tool activity cards
- **Bottom composer**
  - prompt input
  - submit action

### First-launch / no-workspace state
When no workspace is open, Gooey shows a minimal empty state with:
- app shell
- minimal explanation
- **Open Folder** action

This state should feel sparse and intentional, not unfinished.

### Basic flow
1. User opens a local project folder.
2. Gooey creates or selects a workspace entry for that folder.
3. User creates a session.
4. User sends a prompt.
5. Backend appends the user message, runs the agent, streams text and tool events, and persists the resulting transcript.
6. User can switch between sessions and workspaces and resume later.

---

## Core concepts

### Workspace
A workspace is a **local project folder** selected by the user.

Workspace properties:
- corresponds to one folder on disk
- can have many sessions
- appears in the sidebar
- is persisted in Gooey metadata under `~/.gooey`

v0 workspace creation:
- **open existing folder only**
- no in-app project creation flow yet

### Session
A session is a **linear conversation** inside a workspace.

Session properties:
- belongs to exactly one workspace
- contains a sequence of transcript events
- has a mutable title
- starts as **Untitled**
- is auto-titled after the first exchange

### Transcript event
A session is persisted as an ordered sequence of transcript events.

v0 transcript event types:
- `user`
- `assistant`
- `tool_call`
- `tool_result`
- `system`

`system` exists mainly for internal/errors/status-like messages that should survive reloads when needed. Ephemeral streaming deltas do **not** need to be stored as transcript events.

---

## v0 feature scope

### Included
- multiple workspaces
- multiple sessions per workspace
- session creation, selection, renaming, deletion
- session transcript rendering
- prompt composer
- backend-owned conversation state
- TypeScript agent runtime
- OpenAI provider support
- global provider/model config UI
- local persistence in `~/.gooey`
- built-in tools: `read`, `bash`, `edit`, `write`
- streaming assistant text in the UI
- inline compact tool cards in the transcript

### Deferred
- extension loader
- custom tools loaded from user code
- custom prompts/skills loading from disk
- provider overrides per workspace/session
- approval policies
- tree branching/forking
- token usage dashboards
- granular tool permission scopes
- multi-pane activity inspector

---

## Success criteria
Gooey v0 is successful if a user can:
- open a project folder as a workspace
- create and revisit multiple sessions for that workspace
- configure OpenAI in the app
- send prompts and receive streamed responses
- watch tool usage inline as it happens
- close and reopen the app without losing conversations

And the code should clearly support a future where:
- the harness is customizable in TypeScript
- providers can be added cleanly
- tools can eventually become loadable/extensible
- the GUI can later expose extension seams

---

## Architecture

## High-level structure
Gooey v0 has three layers:

### 1. Frontend
React app responsible for:
- workbench UI
- rendering transcript and tool cards
- composer interactions
- settings UI
- subscribing to streaming execution events

### 2. Native backend
Tauri/Rust backend responsible for:
- app lifecycle
- workspace/session persistence
- filesystem-backed config persistence in `~/.gooey`
- launching and supervising the TypeScript runtime process
- acting as the source of truth for sessions and active runs
- relaying execution events to the frontend

### 3. TypeScript harness runtime
A dedicated TS runtime process responsible for:
- agent loop orchestration
- provider abstraction and OpenAI implementation
- tool registry and tool execution
- future-compatible seams for extension loading

## Process model
For v0, Gooey should use a **TypeScript runtime process** launched and supervised by the backend.

Recommended shape:
- backend starts the runtime lazily on first use or app startup
- backend sends run requests to the runtime
- runtime streams execution events back
- backend persists durable events and rebroadcasts them to the UI

This keeps:
- **Rust** focused on app/native concerns
- **TypeScript** focused on harness logic

Exact packaging details can evolve, but the architecture should assume:
- backend-owned orchestration
- TS-owned agent execution

---

## Provider model

### v0 provider requirements
- provider abstraction exists from the start
- only **OpenAI** is implemented in v0
- config is **global only**
- provider/model settings persist under `~/.gooey`

### v0 provider config fields
Minimum global config:
- provider: `openai`
- model: string
- apiKey: string
- optional base URL: string

### Settings UI
v0 settings UI is intentionally minimal.

It only needs to support:
- entering/editing OpenAI API key
- choosing the default model
- optionally editing base URL if needed for compatibility

### Config source of truth
All persisted config lives in `~/.gooey`.
GUI edits must write back to those files.

---

## Tool model

## Built-in tools in v0
The only built-in tools in v0 are:
- `read`
- `bash`
- `edit`
- `write`

No other default tools are required for v0.

## Tool policy
- **No approval prompts by default**
- tools have **full local access** in v0
- this is an explicit product decision for v0 speed and power, not a final security model

## Default execution behavior
- `bash` should run with the active workspace directory as the default working directory
- file tools may access any local path, not just the workspace
- the active workspace path may be included in tool instructions/metadata, but Gooey does **not** preload project contents into context

## Tool UX
Tool usage should appear as **compact inline cards** inside the transcript.

Each tool card should show, at minimum:
- tool name
- running / succeeded / failed state
- short argument summary
- short result summary or output preview

Users should be able to inspect what happened without leaving the conversation.

---

## Context model
The default agent context for a turn is intentionally small.

Included automatically:
- current user prompt
- prior session transcript events
- system/tool instructions needed to explain the available tools and runtime behavior

Not included automatically:
- preloaded project file listings
- indexed codebase summaries
- hidden scanning of the workspace

If the agent wants project context, it should use tools to get it.

---

## Session behavior

### Conversation model
Sessions are **linear only** in v0.

No:
- branches
- forks
- alternate histories

### Naming
New sessions start as `Untitled`.

After the first completed exchange, Gooey auto-generates a title.
For v0, this should be a simple deterministic title derived from the first user prompt rather than a separate title-generation model call.

Example approach:
- trim first user prompt
- collapse whitespace
- use a short prefix as the title

Users can manually rename sessions afterward.

---

## Streaming model

### Required live behavior
v0 must support:
- assistant text streaming in the UI
- tool events appearing while the run is in progress

### Persistence behavior
Streaming deltas do not need to be persisted.
Persist only durable transcript events such as:
- final `user` event
- final `assistant` event
- `tool_call`
- `tool_result`
- `system` event when needed

---

## Data model

## Workspace record
Suggested workspace schema:

```json
{
  "id": "ws_01...",
  "name": "gooey",
  "path": "/Users/miciah/active-projects/gooey",
  "createdAt": "2026-04-15T00:00:00.000Z",
  "updatedAt": "2026-04-15T00:00:00.000Z",
  "lastOpenedAt": "2026-04-15T00:00:00.000Z"
}
```

Notes:
- `id` is Gooey-owned, not derived directly from the path
- `name` defaults to the folder basename but can later become user-editable
- canonicalized path matching should prevent duplicate workspace entries for the same folder

## Session record
Suggested session schema:

```json
{
  "id": "ses_01...",
  "workspaceId": "ws_01...",
  "title": "Untitled",
  "createdAt": "2026-04-15T00:00:00.000Z",
  "updatedAt": "2026-04-15T00:00:00.000Z",
  "events": []
}
```

## Transcript events
Suggested durable event shapes:

```json
{
  "id": "evt_01...",
  "type": "user",
  "createdAt": "2026-04-15T00:00:00.000Z",
  "text": "Summarize this repo."
}
```

```json
{
  "id": "evt_01...",
  "type": "tool_call",
  "runId": "run_01...",
  "toolName": "read",
  "args": {
    "path": "README.md"
  },
  "createdAt": "2026-04-15T00:00:00.000Z"
}
```

```json
{
  "id": "evt_01...",
  "type": "tool_result",
  "runId": "run_01...",
  "toolName": "read",
  "status": "success",
  "summary": "Read 42 lines from README.md",
  "outputPreview": "# Gooey...",
  "createdAt": "2026-04-15T00:00:01.000Z"
}
```

```json
{
  "id": "evt_01...",
  "type": "assistant",
  "runId": "run_01...",
  "provider": "openai",
  "model": "gpt-4.1",
  "text": "This repo is the beginning of Gooey...",
  "createdAt": "2026-04-15T00:00:02.000Z"
}
```

```json
{
  "id": "evt_01...",
  "type": "system",
  "runId": "run_01...",
  "level": "error",
  "text": "OpenAI API key is missing.",
  "createdAt": "2026-04-15T00:00:02.000Z"
}
```

## Event ordering
Events are stored in a single ordered list.
A typical run may look like:
1. `user`
2. `tool_call`
3. `tool_result`
4. `tool_call`
5. `tool_result`
6. `assistant`

`runId` groups events that belong to the same assistant run.

---

## Filesystem layout
All Gooey persistence lives under `~/.gooey`.

Suggested v0 layout:

```text
~/.gooey/
  config.json
  workspaces.json
  workspaces/
    <workspace-id>/
      workspace.json
      sessions/
        <session-id>.json
```

### File responsibilities
- `config.json`
  - global app config
  - provider config
  - default model
- `workspaces.json`
  - small index of known workspaces for fast sidebar restore
- `workspaces/<workspace-id>/workspace.json`
  - canonical workspace metadata
- `workspaces/<workspace-id>/sessions/<session-id>.json`
  - full session transcript record

### Why this layout
This keeps:
- all persistence local-first and user-owned
- sessions clearly grouped by workspace
- room for later addition of tools, prompts, providers, and extensions under the same home directory

---

## Backend API surface
The exact command names can change, but v0 needs backend capabilities roughly equivalent to:

### Workspace commands
- `listWorkspaces()`
- `openWorkspaceFolder()`
- `selectWorkspace(workspaceId)`
- `removeWorkspace(workspaceId)`

### Session commands
- `listSessions(workspaceId)`
- `createSession(workspaceId)`
- `renameSession(sessionId, title)`
- `deleteSession(sessionId)`
- `getSession(sessionId)`

### Settings commands
- `getConfig()`
- `saveConfig(config)`

### Agent/run commands
- `sendPrompt(sessionId, prompt)`
- `cancelRun(runId)`

### Event subscription
Frontend subscribes to backend-emitted events such as:
- run started
- assistant text delta
- tool started
- tool finished
- run completed
- run failed

The backend, not the frontend, owns persistence and durable state transitions.

---

## Error handling
v0 should prefer clarity over cleverness.

At minimum, Gooey should surface:
- missing API key
- provider request failures
- tool execution failures
- file not found / edit mismatch errors
- runtime process unavailable/crashed

Errors should appear inline in the active session via readable system/tool failure UI, not only in logs.

---

## Security posture for v0
v0 deliberately prioritizes speed and flexibility over safety hardening.

Explicit v0 posture:
- no approval prompts
- full local filesystem access
- shell access
- no sandboxing beyond the app/runtime’s natural environment

This is acceptable for v0 because the target user is the local solo developer, but it must be treated as a temporary product posture, not the final security story.

---

## UI requirements

### Sidebar
Must support:
- known workspaces list
- active workspace selection
- sessions list for active workspace
- create session
- rename session
- delete session

### Main transcript pane
Must support:
- empty state for new session
- user messages
- assistant messages
- inline compact tool cards
- inline errors/system events
- live streaming updates

### Composer
Must support:
- multiline prompt input
- send action
- disabled/running state
- basic keyboard submission behavior

### Settings
Must support:
- OpenAI API key entry
- default model selection/input
- persistence to `~/.gooey/config.json`

---

## Implementation order
Recommended build order:

1. **Spec + data model**
   - finalize file layout
   - finalize workspace/session schemas
2. **Static UI shell**
   - sidebar
   - transcript pane
   - composer
   - empty states
3. **Persistence layer**
   - `~/.gooey` bootstrap
   - workspace index
   - session load/save
4. **Backend-owned session flow**
   - create/select sessions
   - send prompt
   - append durable events
5. **TS harness runtime**
   - runtime process launch
   - request/response protocol
6. **OpenAI integration**
   - provider abstraction
   - model config
   - streamed text
7. **Built-in tools**
   - `read`
   - `bash`
   - `edit`
   - `write`
   - inline tool cards
8. **Polish**
   - auto-title
   - error states
   - session management refinement

---

## Deferred for v1+
These are intentionally not required for v0:
- user-installed tools
- extension loading from `~/.gooey/extensions`
- UI extension API
- provider overrides per workspace or session
- tool permission profiles
- branching conversations
- richer activity panes
- workspace-local Gooey files
- advanced model routing
- design system export for extension authors

---

## Final product statement
Gooey v0 should feel like the first honest version of the product:
- sparse
- local-first
- project-oriented
- visibly agentic
- already shaped for TypeScript-powered extensibility

It does **not** need to be broad. It does need to be coherent.
