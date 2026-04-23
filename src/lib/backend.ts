import { invoke } from "@tauri-apps/api/core";
import type { SidebarStateSnapshot } from "../types/gooey";

export const getSidebarState = () =>
  invoke<SidebarStateSnapshot>("get_sidebar_state");

export const addWorkspace = (path: string) =>
  invoke<SidebarStateSnapshot>("add_workspace", { path });

export const createSession = (workspaceId: string) =>
  invoke<SidebarStateSnapshot>("create_session", { workspaceId });

export const archiveSession = (sessionId: string) =>
  invoke<SidebarStateSnapshot>("archive_session", { sessionId });

export const selectSession = (sessionId: string) =>
  invoke<SidebarStateSnapshot>("select_session", { sessionId });
