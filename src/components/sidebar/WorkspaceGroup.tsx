import React from "react";
import { ChevronRightIcon, FolderIcon, FolderOpenIcon } from "lucide-react";
import ProjectActivityChip from "./ProjectActivityChip";
import SessionRow from "./SessionRow";
import type { Workspace } from "./types";
import SidebarItemButton from "../ui/SidebarItemButton";

type WorkspaceGroupProps = {
  workspace: Workspace;
  isCollapsed: boolean;
  activeSessionId: string;
  onSessionSelect(sessionId: string): void;
  onToggleCollapse(): void;
};

const WorkspaceGroup: React.FC<WorkspaceGroupProps> = ({
  workspace,
  isCollapsed,
  activeSessionId,
  onSessionSelect,
  onToggleCollapse,
}) => {
  const WorkspaceIcon = isCollapsed ? FolderIcon : FolderOpenIcon;
  const workingCount = workspace.sessions.filter(
    (session) => session.status === "working",
  ).length;
  const unreadCount = workspace.sessions.filter(
    (session) => session.status === "unread",
  ).length;
  const hasActivity = workingCount > 0 || unreadCount > 0;

  return (
    <div
      className={`transition-[margin-bottom] duration-200 ease-out ${
        isCollapsed ? "mb-0" : "mb-2"
      }`}
    >
      <SidebarItemButton
        className="gap-2.5 py-1"
        onClick={onToggleCollapse}
        aria-expanded={!isCollapsed}
      >
        <WorkspaceIcon
          aria-hidden="true"
          className="h-[15px] w-[15px] shrink-0 text-[#8f857c]"
          strokeWidth={1.9}
        />
        <span className="min-w-0 flex-1 truncate text-[13px] tracking-[-0.01em] text-[#8f857c]">
          {workspace.name}
        </span>
        {hasActivity && (
          <span
            className={`mr-0.5 flex shrink-0 overflow-hidden transition-opacity duration-200 ease-out ${
              isCollapsed ? "opacity-100" : "opacity-0"
            }`}
          >
            <ProjectActivityChip
              workingCount={workingCount}
              unreadCount={unreadCount}
            />
          </span>
        )}
        <ChevronRightIcon
          aria-hidden="true"
          className={`h-3.5 w-3.5 shrink-0 text-[#6f6760] transition-transform duration-150 ${
            isCollapsed ? "" : "rotate-90"
          }`}
          strokeWidth={2}
        />
      </SidebarItemButton>
      <div
        className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin-top] duration-200 ease-out ${
          isCollapsed
            ? "mt-0 grid-rows-[0fr] opacity-0"
            : "mt-0.5 grid-rows-[1fr] opacity-100"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          {workspace.sessions.length === 0 ? (
            <div className="py-1.5 pl-[2.0625rem] pr-2 text-[13px] text-[#655c55]">
              No chats
            </div>
          ) : (
            <div className="space-y-0.5">
              {workspace.sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  onSelect={onSessionSelect}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceGroup;
