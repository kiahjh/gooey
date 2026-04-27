import React from "react";
import cx from "clsx";
import ChatSidebarContent from "./sidebar/ChatSidebarContent";
import SettingsSidebarContent from "./sidebar/SettingsSidebarContent";
import { useGooeyStore } from "../state/useGooeyStore";

const Sidebar: React.FC = () => {
  const currentScreen = useGooeyStore((state) => state.currentScreen);
  const isSettingsScreen = currentScreen === "settings";

  return (
    <aside className="flex min-h-0 w-[268px] shrink-0 flex-col overflow-hidden px-2 pb-2">
      <div
        data-tauri-drag-region
        className="relative -mx-2 h-[47px] shrink-0 select-none"
      >
        <div className="absolute left-[15.5px] top-[15px] h-4 w-4 rounded-full border border-[#433d38] bg-[#1d1a18]" />
        <div className="absolute left-[38.5px] top-[15px] h-4 w-4 rounded-full border border-[#433d38] bg-[#1d1a18]" />
        <div className="absolute left-[61.5px] top-[15px] h-4 w-4 rounded-full border border-[#433d38] bg-[#1d1a18]" />
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className={cx(
            "flex h-full min-h-0 w-[200%] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
            isSettingsScreen ? "-translate-x-1/2" : "translate-x-0",
          )}
        >
          <div
            aria-hidden={isSettingsScreen}
            className={cx(
              "min-h-0 w-1/2 shrink-0",
              isSettingsScreen ? "pointer-events-none" : "pointer-events-auto",
            )}
          >
            <ChatSidebarContent />
          </div>
          <div
            aria-hidden={!isSettingsScreen}
            className={cx(
              "min-h-0 w-1/2 shrink-0",
              isSettingsScreen ? "pointer-events-auto" : "pointer-events-none",
            )}
          >
            <SettingsSidebarContent />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
