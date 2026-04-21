import React, { useState } from "react";
import { PenSquareIcon, Settings2Icon } from "lucide-react";
import ProjectsSection from "./sidebar/ProjectsSection";
import { mockWorkspaces } from "./sidebar/mockSidebarData";
import MainSidebarButton from "./ui/MainSidebarButton";

const Sidebar: React.FC = () => {
  const [activeSessionId, setActiveSessionId] = useState("gooey-1");
  const workspaces = mockWorkspaces.map((workspace) => ({
    ...workspace,
    sessions: workspace.sessions.filter((session) => !session.archived),
  }));

  return (
    <aside className="flex min-h-0 w-[268px] shrink-0 flex-col overflow-hidden px-2 pb-2">
      <div className="flex min-h-0 flex-1 flex-col">
        <MainSidebarButton
          icon={PenSquareIcon}
          label="New chat"
          kbd="⌘N"
          onClick={() => {}}
        />
        <MainSidebarButton
          icon={Settings2Icon}
          label="Settings"
          kbd="⌘,"
          onClick={() => {}}
        />
        <ProjectsSection
          workspaces={workspaces}
          activeSessionId={activeSessionId}
          onSessionSelect={setActiveSessionId}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
