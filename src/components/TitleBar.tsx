import React from "react";

const TitleBar: React.FC = () => {
  return (
    <header
      data-tauri-drag-region
      className="flex h-[47px] shrink-0 items-center select-none relative"
    >
      <div className="w-4 h-4 rounded-full border border-mauve-300/60 absolute left-[15.5px] top-[15px]" />
      <div className="w-4 h-4 rounded-full border border-mauve-300/60 absolute left-[38.5px] top-[15px]" />
      <div className="w-4 h-4 rounded-full border border-mauve-300/60 absolute left-[61.5px] top-[15px]" />
    </header>
  );
};

export default TitleBar;
