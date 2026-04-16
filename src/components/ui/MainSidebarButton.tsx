import React from "react";
import type { LucideIcon } from "lucide-react";
import Kbd from "./Kbd";

type MainSidebarButtonProps = {
  label: string;
  icon: LucideIcon;
  onClick(): void;
  kbd?: string;
};

const MainSidebarButton: React.FC<MainSidebarButtonProps> = ({
  label,
  icon: Icon,
  onClick,
  kbd,
}) => {
  return (
    <button
      className="flex items-center justify-between hover:bg-mauve-200 rounded-xl p-1.5 px-2 group active:scale-98 transition-transform duration-100"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <Icon aria-hidden="true" className="w-4 h-4 text-mauve-600" />
        <span className="text-mauve-900 text-sm">{label}</span>
      </div>
      {kbd && <Kbd className="opacity-0 group-hover:opacity-100">{kbd}</Kbd>}
    </button>
  );
};

export default MainSidebarButton;
