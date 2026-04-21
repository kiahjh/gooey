import React from "react";
import type { Session } from "./types";

type SessionStatusIndicatorProps = {
  status: Session["status"];
};

const SessionStatusIndicator: React.FC<SessionStatusIndicatorProps> = ({
  status,
}) => {
  if (status === "idle") {
    return null;
  }

  if (status === "unread") {
    return <span className="h-2 w-2 rounded-full bg-[#e5d28d]" />;
  }

  return (
    <span className="block h-3 w-3 animate-spin rounded-full border-[1.5px] border-[#7eb6ef]/25 border-t-[#7eb6ef]" />
  );
};

export default SessionStatusIndicator;
