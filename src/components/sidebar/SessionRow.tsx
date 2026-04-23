import React from "react";
import { ArchiveIcon } from "lucide-react";
import type { Session } from "./types";
import SidebarItemButton from "../ui/SidebarItemButton";
import { formatRelativeTime } from "../../lib/relativeTime";
import SessionStatusIndicator from "./SessionStatusIndicator";
import SidebarIconButton from "./SidebarIconButton";

type SessionRowProps = {
  session: Session;
  isActive: boolean;
  onSelect(sessionId: string): void;
  onArchive(sessionId: string): void;
};

const SessionRow: React.FC<SessionRowProps> = ({
  session,
  isActive,
  onSelect,
  onArchive,
}) => {
  return (
    <div className="group relative">
      <SidebarItemButton
        active={isActive}
        className="gap-2.5 pr-9"
        onClick={() => onSelect(session.id)}
      >
        <span className="flex h-[15px] w-[15px] shrink-0 items-center justify-center">
          <SessionStatusIndicator status={session.status} />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] tracking-[-0.01em] text-[#ede8e2]">
          {session.title}
        </span>
      </SidebarItemButton>
      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
        <span className="text-[12px] text-[#998f86] transition-opacity duration-100 group-hover:opacity-0">
          {formatRelativeTime(session.updatedAt)}
        </span>
        <span className="pointer-events-auto absolute right-0">
          <SidebarIconButton
            ariaLabel={`Archive ${session.title}`}
            icon={ArchiveIcon}
            tooltip="Archive conversation"
            onClick={() => onArchive(session.id)}
            className="h-5 w-5 rounded-md opacity-0 pointer-events-none transition-opacity duration-100 group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-[#2a2521]"
          />
        </span>
      </div>
    </div>
  );
};

export default SessionRow;
