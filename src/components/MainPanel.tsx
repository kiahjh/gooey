import React from "react";
import MainPanelPromptDock from "./main-panel/MainPanelPromptDock";
import SettingsPanelContent from "./main-panel/SettingsPanelContent";
import { useGooeyStore } from "../state/useGooeyStore";

const MainPanel: React.FC = () => {
  const currentScreen = useGooeyStore((state) => state.currentScreen);

  return (
    <section className="relative h-full rounded-[10px] border-[0.5px] border-[#39342f] bg-[#1d1a18] shadow shadow-black/25">
      <div
        data-tauri-drag-region
        className="absolute inset-x-0 top-0 h-[47px] rounded-t-[10px]"
      />
      {currentScreen === "settings" ? (
        <SettingsPanelContent />
      ) : (
        <MainPanelPromptDock />
      )}
    </section>
  );
};

export default MainPanel;
