const IS_MAC = navigator.userAgent.toLowerCase().includes("mac");

function App() {
  return (
    <div className="flex h-screen flex-col bg-white text-black">
      <header className="flex h-10 shrink-0 items-center border-b border-neutral-200 select-none">
        {IS_MAC && <div className="w-[80px] shrink-0" data-tauri-drag-region />}
        <div
          className="flex min-w-0 flex-1 items-center justify-center px-4"
          data-tauri-drag-region
        >
          <span>gooey</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <span className="text-sm text-neutral-500">blank slate</span>
      </main>
    </div>
  );
}

export default App;
