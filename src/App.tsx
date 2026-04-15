import React from "react";
import Sidebar from "./components/Sidebar";

const App: React.FC = () => {
  return (
    <div className="flex h-screen flex-col bg-mauve-100">
      <header
        data-tauri-drag-region
        className="flex h-9 shrink-0 items-center select-none"
      ></header>

      <main className="flex flex-grow">
        <Sidebar />
        <div className="bg-mauve-50 flex-grow rounded-[12px] mr-2 mb-2 border-[0.5px] border-mauve-200 shadow shadow-mauve-500/20">
          conversation
        </div>
      </main>
    </div>
  );
};

export default App;
