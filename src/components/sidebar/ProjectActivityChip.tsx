import React from "react";

type ProjectActivityChipProps = {
  workingCount: number;
  unreadCount: number;
};

const ProjectActivityChip: React.FC<ProjectActivityChipProps> = ({
  workingCount,
  unreadCount,
}) => {
  if (workingCount === 0 && unreadCount === 0) {
    return null;
  }

  return (
    <span className="flex shrink-0 items-center gap-0.75 whitespace-nowrap rounded-[6px] border border-[#332d27] px-1.25 py-[0.125rem] text-[9px] text-[#93887f]">
      {workingCount > 0 && (
        <span className="flex items-center gap-0.5">
          <span className="block h-2.25 w-2.25 animate-spin rounded-full border-[1.5px] border-[#7eb6ef]/20 border-t-[#7eb6ef]" />
          <span>{workingCount}</span>
        </span>
      )}
      {workingCount > 0 && unreadCount > 0 && (
        <span className="text-[#655c55]">/</span>
      )}
      {unreadCount > 0 && (
        <span className="flex items-center gap-0.5">
          <span className="h-1.75 w-1.75 rounded-full bg-[#e5d28d]" />
          <span>{unreadCount}</span>
        </span>
      )}
    </span>
  );
};

export default ProjectActivityChip;
