import React from "react";
import Sidebar from "./components/Sidebar";
import TitleBar from "./components/TitleBar";

const App: React.FC = () => {
  return (
    <div className="flex h-screen flex-col bg-[#131211] text-[#f2eeea]">
      <TitleBar />
      <main className="flex min-h-0 flex-grow">
        <Sidebar />
        <div className="mr-2 mb-2 flex-grow rounded-[12px] border-[0.5px] border-[#39342f] bg-[#1d1a18] shadow shadow-black/25"></div>
      </main>
    </div>
  );
};

export default App;
