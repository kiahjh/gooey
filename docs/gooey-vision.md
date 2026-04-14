# Gooey Vision

## Working title
Gooey

## Core positioning
- **The NeoVim of agents**
- **Extensibility is the product**
- A **GUI-native agent harness/workbench** for solo developers
- Inspired by Pi’s philosophy, but **not a GUI wrapper around Pi** and **not constrained by Pi compatibility**

## Product thesis
Most agent products are fixed-purpose chat apps with some tools attached.
Gooey should instead be a **minimal, beautiful, programmable workbench** where users can shape the agent, UI, tools, workflows, and behavior to match how they work.

The default experience should feel almost empty, but not useless: just enough built-in structure for Gooey to start extending itself.

## Target user
### Primary user for v1
- Solo developers

### Initial use case focus
- Coding first
- Architecture should allow broader agent/workbench use cases later

## Product principles
1. **Minimal by default**  
   The initial interface should be calm, sparse, and non-bloated.

2. **Deeply extensible**  
   Tools, commands, prompts, providers, UI, layout, themes, and behavior should all be extensible.

3. **Code-first customization**  
   Customization is primarily done with code and files, not only settings toggles.

4. **Local-first**  
   User configuration and extensions should live on disk under `~/.gooey/*`.

5. **Gooey-native design**  
   Gooey should take inspiration from Pi, but optimize for a GUI-first experience.

6. **Self-extension**  
   Gooey should be able to help users write and modify its own extensions and configuration.

7. **No permission popups by default**  
   Keep the default harness fast and unobtrusive. Permission systems can be added/configured later.

## Non-goals for v1
- Strict compatibility with Pi internals or file layout
- Reproducing Pi’s exact session tree / branching model
- Building a maximal “AI IDE” with every feature built-in
- Heavy default setup/config before first use

## Platform and stack direction
### App shell
- **Tauri app**, starting on **macOS**

### Frontend
- **React**
- Likely use **Radix UI primitives** for accessibility, while building a **custom Gooey design system** on top

### Runtime model
- Gooey uses its **own harness/runtime**, not an embedded Pi runtime
- TypeScript is the initial extension language
- Extension execution will need to support **both agent/runtime-side logic and UI-side logic**

## Core UX model
### Primary app model
Gooey is centered around:
- a **sidebar of projects/workspaces**
- each workspace containing **multiple named conversations/sessions**

### Default layout
- **Left sidebar** for projects/workspaces and conversations/sessions
- **Main output pane** for the active conversation/workbench content
- **Bottom prompt input**

### Default first-launch feel
- Very minimal
- Bare workbench
- Prompt/input is present
- Sidebar is present
- Everything else should feel hidden, latent, or ready to be added

## Session model
- Sessions/conversations matter in v1
- Multiple named conversations per workspace
- Pi-style tree branching is **not required in v1**
- More advanced session behaviors can be added later or exposed through extension mechanisms

## Extensibility vision
Gooey should eventually allow users to customize essentially everything.
For v1, the intent is still broad: extensibility is not a side feature, it is the core reason the product exists.

### Extensibility surfaces
- Tools
- Commands/actions
- Skills / reusable capabilities
- Prompt templates / behavior scaffolding
- Themes
- Providers / models
- Lifecycle hooks / event system
- Custom UI panels / components
- Layout composition
- Workflows / automations
- Memory/context behavior
- Keyboard-driven workflows

## Extension model
### Language
- **TypeScript first**
- Potentially more languages later

### Loading/discovery
- Start with a **global Gooey config/home** under `~/.gooey/*`
- No heavy initial config required before use
- Users should create/configure files once they start customizing

### Reloading
- **Manual reload command/button** is sufficient for v1

### Self-extension behavior
A key requirement is that Gooey can help users extend Gooey itself.

That means the agent should be able to:
- inspect the user’s Gooey files
- write/modify Gooey extensions
- update Gooey config
- create UI extensions using Gooey’s design system and component library

## Config and filesystem direction
### User config home
- `~/.gooey/*`

### Model/provider setup
- Built-in provider support with **GUI setup**
- Configuration should also be **synced to filesystem** in the user config

### Initial config philosophy
- Do **not** force a large up-front config
- Allow configuration to emerge as the user customizes

## Built-in capabilities for v1
### Models/providers
- Built-in provider support
- GUI flow for setting them up
- Filesystem-backed persistence in `~/.gooey/*`

### Tools
- Ship built-in coding tools
- Support custom tool loading from the start

### Agent behavior
- Gooey ships with a default harness/agent behavior built by us
- Users should be able to replace or reshape it over time

## GUI extensibility requirements
A major differentiator is that **the GUI itself must be extensible**, not just the underlying agent.

### V1 goal
Provide a path toward a GUI extension API that supports:
- custom panels/views
- custom UI components
- user-defined commands/actions
- workbench augmentation
- future layout composition

### Design requirement
Gooey needs a **strong, exhaustive design system and component library** so the app can evolve and self-extend **without becoming ugly or incoherent**.

This is critical because the agent itself may generate or modify Gooey UI.

## Design goals
Gooey v1 should aim for all of the following at once:
- **Beautiful minimalism**
- **Fluid self-customization / self-extension**
- **Visual transparency around tool use and agent behavior**
- **Composable workbench feel**

## Product framing
### Short version
Gooey is a GUI-native, deeply extensible agent harness for developers.

### More opinionated version
Gooey is a minimal, local-first workbench for building your own agent environment.

### Tagline candidates
- The NeoVim of agents
- Extensibility is the product
- A programmable GUI workbench for agents
- Build your own harness, visually

## Early architectural implications
1. **Separation of concerns**  
   Keep a clear boundary between:
   - core agent runtime
   - extension runtime
   - UI/workbench runtime
   - persistent config/state

2. **Filesystem as source of truth for customization**  
   GUI flows may help author or manage extensions, but user-owned files should remain important.

3. **Bidirectional GUI ↔ file sync**  
   Provider setup and other configurable resources should be editable in the GUI while persisting cleanly to disk.

4. **UI extension safety via design system**  
   The extension surface for UI should strongly encourage use of Gooey primitives/tokens/components.

5. **Minimal built-in opinionation**  
   Ship a good default harness, but don’t over-hardcode one workflow.

## Open questions for the next spec
These do not block the vision, but need resolution in the next document:
- Exact extension API shape
- Exact filesystem layout under `~/.gooey/`
- How frontend-side vs backend-side extensions communicate
- Whether extensions run in one runtime or multiple isolated runtimes
- How custom panels are declared and mounted
- How conversations are stored on disk
- How workspaces are represented and restored
- Whether project-local Gooey resources exist in v1 or only global ones
- Exact built-in tools for the first release
- How design tokens/components are exposed to extension authors

## Proposed next document
`docs/gooey-v1-spec.md`

This should translate the vision into:
- concrete v1 scope
- filesystem layout
- app architecture
- extension system design
- conversation/workspace model
- UI information architecture
- milestone plan
