import React, { useEffect } from "react";
import MainPanel from "./components/MainPanel";
import Sidebar from "./components/Sidebar";
import { useGooeyStore } from "./state/useGooeyStore";

const App: React.FC = () => {
  const initialize = useGooeyStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <div className="flex h-screen bg-[#131211] text-[#f2eeea]">
      <Sidebar />
      <main className="min-w-0 flex-1 py-2 pr-2">
        <MainPanel />
      </main>
    </div>
  );
};

export default App;
