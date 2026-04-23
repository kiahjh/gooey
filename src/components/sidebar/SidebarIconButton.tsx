import React from "react";
import cx from "clsx";
import type { LucideIcon } from "lucide-react";
import Tooltip from "../ui/Tooltip";

type SidebarIconButtonProps = {
  ariaLabel: string;
  icon: LucideIcon;
  onClick(): void;
  tooltip: string;
  className?: string;
  disabled?: boolean;
};

const SidebarIconButton: React.FC<SidebarIconButtonProps> = ({
  ariaLabel,
  icon: Icon,
  onClick,
  tooltip,
  className,
  disabled = false,
}) => {
  return (
    <Tooltip side="top" content={tooltip}>
      <button
        type="button"
        className={cx(
          "flex h-6 w-6 scale-100 items-center justify-center rounded-lg text-[#736961] transform-gpu transition-colors transition-transform duration-100 ease-out",
          disabled
            ? "cursor-not-allowed opacity-45"
            : "hover:bg-[#201d1a] hover:text-[#8c8178] active:scale-[0.92]",
          className,
        )}
        aria-label={ariaLabel}
        onClick={onClick}
        disabled={disabled}
      >
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
    </Tooltip>
  );
};

export default SidebarIconButton;
