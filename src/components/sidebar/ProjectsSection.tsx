import React, { useEffect, useMemo, useRef, useState } from "react";
import { Maximize2Icon, Minimize2Icon } from "lucide-react";
import Tooltip from "../ui/Tooltip";
import WorkspaceGroup from "./WorkspaceGroup";
import type { Workspace } from "./types";

type ProjectsSectionProps = {
  workspaces: Workspace[];
  activeSessionId: string;
  onSessionSelect(sessionId: string): void;
};

const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  workspaces,
  activeSessionId,
  onSessionSelect,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [collapsedWorkspaceIds, setCollapsedWorkspaceIds] = useState<
    Record<string, boolean>
  >(() =>
    Object.fromEntries(workspaces.map((workspace) => [workspace.id, false])),
  );
  const [showScrollFade, setShowScrollFade] = useState({
    top: false,
    bottom: false,
  });
  const areAllCollapsed = useMemo(
    () => workspaces.every((workspace) => collapsedWorkspaceIds[workspace.id]),
    [collapsedWorkspaceIds, workspaces],
  );
  const HeaderActionIcon = areAllCollapsed ? Maximize2Icon : Minimize2Icon;

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
        <Tooltip
          side="top"
          content={
            areAllCollapsed ? "Expand all projects" : "Collapse all projects"
          }
        >
          <button
            type="button"
            className="flex h-6 w-6 scale-100 items-center justify-center rounded-lg text-[#736961] transform-gpu transition-colors transition-transform duration-100 ease-out hover:bg-[#201d1a] hover:text-[#8c8178] active:scale-[0.92]"
            aria-label={
              areAllCollapsed ? "Expand all projects" : "Collapse all projects"
            }
            onClick={() =>
              setCollapsedWorkspaceIds(
                Object.fromEntries(
                  workspaces.map((workspace) => [
                    workspace.id,
                    !areAllCollapsed,
                  ]),
                ),
              )
            }
          >
            <HeaderActionIcon aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
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
              onToggleCollapse={() =>
                setCollapsedWorkspaceIds((current) => ({
                  ...current,
                  [workspace.id]: !current[workspace.id],
                }))
              }
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
