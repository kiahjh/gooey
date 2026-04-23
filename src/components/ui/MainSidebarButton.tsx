import React from "react";
import type { LucideIcon } from "lucide-react";
import Kbd from "./Kbd";
import SidebarItemButton from "./SidebarItemButton";

type MainSidebarButtonProps = {
  label: string;
  icon: LucideIcon;
  onClick(): void;
  kbd?: string;
  disabled?: boolean;
};

const MainSidebarButton: React.FC<MainSidebarButtonProps> = ({
  label,
  icon: Icon,
  onClick,
  kbd,
  disabled = false,
}) => {
  return (
    <SidebarItemButton
      className="justify-between gap-2"
      onClick={onClick}
      disabled={disabled}
    >
      <div className="flex items-center gap-2">
        <Icon aria-hidden="true" className="h-[15px] w-[15px] text-[#aca49c]" />
        <span className="text-[13px] tracking-[-0.01em] text-[#f2eeea]">
          {label}
        </span>
      </div>
      {kbd && <Kbd className="opacity-0 group-hover:opacity-100">{kbd}</Kbd>}
    </SidebarItemButton>
  );
};

export default MainSidebarButton;
