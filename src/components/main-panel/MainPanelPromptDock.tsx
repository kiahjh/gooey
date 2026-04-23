import React from "react";
import PromptComposerShell from "./PromptComposerShell";

const MainPanelPromptDock: React.FC = () => {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-6 pb-6">
      <div className="pointer-events-auto w-full max-w-[760px]">
        <PromptComposerShell />
      </div>
    </div>
  );
};

export default MainPanelPromptDock;
