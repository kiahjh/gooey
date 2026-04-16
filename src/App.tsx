import React from "react";
import Sidebar from "./components/Sidebar";
import TitleBar from "./components/TitleBar";

const App: React.FC = () => {
  return (
    <div className="flex h-screen flex-col bg-mauve-100">
      <TitleBar />
      <main className="flex flex-grow">
        <Sidebar />
        <div className="bg-mauve-50 flex-grow rounded-[12px] mr-2 mb-2 border-[0.5px] border-mauve-200 shadow shadow-mauve-500/20"></div>
      </main>
    </div>
  );
};

export default App;
