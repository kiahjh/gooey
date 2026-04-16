import React from "react";
import { PenSquareIcon, Settings2Icon } from "lucide-react";
import MainSidebarButton from "./ui/MainSidebarButton";

const Sidebar: React.FC = () => {
  return (
    <aside className="flex w-64 shrink-0 flex-col px-2 pb-2">
      <div className="flex flex-col">
        <MainSidebarButton
          icon={PenSquareIcon}
          label="New chat"
          kbd="⌘N"
          onClick={() => {}}
        />
        <MainSidebarButton
          icon={Settings2Icon}
          label="Settings"
          kbd="⌘,"
          onClick={() => {}}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
