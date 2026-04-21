import React from "react";

const TitleBar: React.FC = () => {
  return (
    <header
      data-tauri-drag-region
      className="relative flex h-[47px] shrink-0 items-center select-none"
    >
      <div className="absolute left-[15.5px] top-[15px] h-4 w-4 rounded-full border border-[#433d38] bg-[#1d1a18]" />
      <div className="absolute left-[38.5px] top-[15px] h-4 w-4 rounded-full border border-[#433d38] bg-[#1d1a18]" />
      <div className="absolute left-[61.5px] top-[15px] h-4 w-4 rounded-full border border-[#433d38] bg-[#1d1a18]" />
    </header>
  );
};

export default TitleBar;
