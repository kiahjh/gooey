import React, { useEffect, useMemo, useRef, useState } from "react";
import { Maximize2Icon, Minimize2Icon, PlusIcon } from "lucide-react";
import ProjectsHeaderButton from "./ProjectsHeaderButton";
import WorkspaceGroup from "./WorkspaceGroup";
import type { Workspace } from "./types";

type ProjectsSectionProps = {
  workspaces: Workspace[];
  activeSessionId: string | null;
  onSessionSelect(sessionId: string): void;
  onSessionArchive(sessionId: string): void;
  onCreateSession(workspaceId: string): void;
  onAddProject(): void;
  onToggleWorkspaceCollapsed(workspaceId: string): void;
  onToggleAllProjects(): void;
  collapsedWorkspaceIds: Record<string, boolean>;
};

const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  workspaces,
  activeSessionId,
  onSessionSelect,
  onSessionArchive,
  onCreateSession,
  onAddProject,
  onToggleWorkspaceCollapsed,
  onToggleAllProjects,
  collapsedWorkspaceIds,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [showScrollFade, setShowScrollFade] = useState({
    top: false,
    bottom: false,
  });
  const areAllCollapsed = useMemo(
    () => workspaces.every((workspace) => collapsedWorkspaceIds[workspace.id]),
    [collapsedWorkspaceIds, workspaces],
  );
  const CollapseActionIcon = areAllCollapsed ? Maximize2Icon : Minimize2Icon;
  const collapseActionLabel = areAllCollapsed
    ? "Expand all projects"
    : "Collapse all projects";

  useEffect(() => {
    const updateScrollFade = () => {
      const element = listRef.current;

      if (!element) {
        return;
      }

      setShowScrollFade({
        top: element.scrollTop > 1,
        bottom:
          element.scrollTop + element.clientHeight < element.scrollHeight - 1,
      });
    };

    const frameId = requestAnimationFrame(updateScrollFade);

    window.addEventListener("resize", updateScrollFade);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateScrollFade);
    };
  }, [collapsedWorkspaceIds, workspaces]);

  return (
    <section className="mt-5 flex min-h-0 flex-1 flex-col">
      <div className="mb-1.5 shrink-0 flex items-center justify-between px-2">
        <h2 className="text-[12px] tracking-[0.01em] text-[#736961]">
          Projects
        </h2>
        <div className="flex items-center gap-1">
          <ProjectsHeaderButton
            tooltip="Add project"
            ariaLabel="Add project"
            icon={PlusIcon}
            onClick={onAddProject}
          />
          <ProjectsHeaderButton
            tooltip={collapseActionLabel}
            ariaLabel={collapseActionLabel}
            icon={CollapseActionIcon}
            onClick={onToggleAllProjects}
            disabled={workspaces.length === 0}
          />
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={listRef}
          className="hide-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pr-1"
          onScroll={() => {
            const element = listRef.current;

            if (!element) {
              return;
            }

            setShowScrollFade({
              top: element.scrollTop > 1,
              bottom:
                element.scrollTop + element.clientHeight <
                element.scrollHeight - 1,
            });
          }}
        >
          {workspaces.map((workspace) => (
            <WorkspaceGroup
              key={workspace.id}
              workspace={workspace}
              isCollapsed={collapsedWorkspaceIds[workspace.id] ?? false}
              activeSessionId={activeSessionId}
              onSessionSelect={onSessionSelect}
              onSessionArchive={onSessionArchive}
              onCreateSession={onCreateSession}
              onToggleCollapse={() => onToggleWorkspaceCollapsed(workspace.id)}
            />
          ))}
        </div>
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#131211] via-[#131211]/88 to-transparent transition-opacity duration-150 ${
            showScrollFade.top ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#131211] via-[#131211]/92 to-transparent transition-opacity duration-150 ${
            showScrollFade.bottom ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </section>
  );
};

export default ProjectsSection;
