import React from "react";
import type { Session } from "./types";
import SessionStatusIndicator from "./SessionStatusIndicator";
import SidebarItemButton from "../ui/SidebarItemButton";

type SessionRowProps = {
  session: Session;
  isActive: boolean;
  onSelect(sessionId: string): void;
};

const SessionRow: React.FC<SessionRowProps> = ({
  session,
  isActive,
  onSelect,
}) => {
  return (
    <SidebarItemButton
      active={isActive}
      className="gap-2.5"
      onClick={() => onSelect(session.id)}
    >
      <span className="flex h-[15px] w-[15px] shrink-0 items-center justify-center">
        <SessionStatusIndicator status={session.status} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] tracking-[-0.01em] text-[#ede8e2]">
        {session.title}
      </span>
      <span className="shrink-0 text-[12px] text-[#998f86]">
        {session.updatedAtLabel}
      </span>
    </SidebarItemButton>
  );
};

export default SessionRow;
