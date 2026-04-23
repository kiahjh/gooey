import React from "react";
import type { LucideIcon } from "lucide-react";
import SidebarIconButton from "./SidebarIconButton";

type ProjectsHeaderButtonProps = {
  ariaLabel: string;
  icon: LucideIcon;
  onClick(): void;
  tooltip: string;
  disabled?: boolean;
};

const ProjectsHeaderButton: React.FC<ProjectsHeaderButtonProps> = ({
  ariaLabel,
  icon,
  onClick,
  tooltip,
  disabled = false,
}) => {
  return (
    <SidebarIconButton
      ariaLabel={ariaLabel}
      icon={icon}
      onClick={onClick}
      tooltip={tooltip}
      disabled={disabled}
    />
  );
};

export default ProjectsHeaderButton;
