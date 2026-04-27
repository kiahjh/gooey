import React from "react";
import { ArrowLeftIcon, PlugZapIcon } from "lucide-react";
import MainSidebarButton from "../ui/MainSidebarButton";
import { useGooeyStore } from "../../state/useGooeyStore";

const SettingsSidebarContent: React.FC = () => {
  const activeSettingsSection = useGooeyStore(
    (state) => state.activeSettingsSection,
  );
  const closeSettings = useGooeyStore((state) => state.closeSettings);
  const selectSettingsSection = useGooeyStore(
    (state) => state.selectSettingsSection,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MainSidebarButton
        icon={ArrowLeftIcon}
        label="Back to chats"
        onClick={closeSettings}
      />
      <section className="mt-5 flex min-h-0 flex-1 flex-col">
        <div className="mb-2 px-2">
          <h2 className="text-[12px] tracking-[0.01em] text-[#736961]">
            Settings
          </h2>
        </div>
        <div className="space-y-0.5">
          <MainSidebarButton
            label="Providers"
            icon={PlugZapIcon}
            active={activeSettingsSection === "providers"}
            ariaPressed={activeSettingsSection === "providers"}
            iconClassName="text-[#9b928b]"
            onClick={() => selectSettingsSection("providers")}
          />
        </div>
      </section>
    </div>
  );
};

export default SettingsSidebarContent;
