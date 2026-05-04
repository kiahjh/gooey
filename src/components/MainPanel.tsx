import React from "react";
import ConversationTranscript from "./main-panel/ConversationTranscript";
import MainPanelPromptDock from "./main-panel/MainPanelPromptDock";
import SettingsPanelContent from "./main-panel/SettingsPanelContent";
import { useGooeyStore } from "../state/useGooeyStore";

const MainPanel: React.FC = () => {
  const currentScreen = useGooeyStore((state) => state.currentScreen);
  const activeSessionId = useGooeyStore((state) => state.activeSessionId);
  const activeWorkspaceId = useGooeyStore((state) => state.activeWorkspaceId);
  const workspaces = useGooeyStore((state) => state.workspaces);
  const createSession = useGooeyStore((state) => state.createSession);
  const openWorkspace = useGooeyStore((state) => state.openWorkspace);
  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null;
  const activeSession =
    activeWorkspace?.sessions.find((session) => session.id === activeSessionId) ??
    null;

  return (
    <section className="relative h-full rounded-[10px] border-[0.5px] border-[#39342f] bg-[#1d1a18] shadow shadow-black/25">
      <div
        data-tauri-drag-region
        className="absolute inset-x-0 top-0 h-[47px] rounded-t-[10px]"
      />
      {currentScreen === "settings" ? (
        <SettingsPanelContent />
      ) : (
        <>
          <ConversationTranscript
            session={activeSession}
            workspaceName={activeWorkspace?.name ?? null}
            onCreateSession={() => {
              if (activeWorkspace) void createSession(activeWorkspace.id);
            }}
            onOpenWorkspace={() => {
              void openWorkspace();
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[170px] bg-gradient-to-b from-[#1d1a18]/0 via-[#1d1a18] to-[#1d1a18]" />
          <MainPanelPromptDock />
        </>
      )}
    </section>
  );
};

export default MainPanel;
