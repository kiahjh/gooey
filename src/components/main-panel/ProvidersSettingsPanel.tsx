import React from "react";
import cx from "clsx";
import { getOpenAIConnectionStatus } from "../../lib/backend";
import { getErrorMessage } from "../../lib/errors";
import type { ProviderConnectionStatus } from "../../types/providers";
import OpenAIProviderConnectionDetails from "./OpenAIProviderConnectionDetails";

type ProviderState = "connected" | "available";
type ProviderLogo = "openai" | "anthropic";

type Provider = {
  name: string;
  status: ProviderState;
  logo: ProviderLogo;
  comingSoon?: boolean;
};

const ProvidersSettingsPanel: React.FC = () => {
  const [expandedProvider, setExpandedProvider] = React.useState<ProviderLogo | null>(null);
  const [openAIStatus, setOpenAIStatus] = React.useState<ProviderConnectionStatus | null>(null);
  const [statusErrorMessage, setStatusErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    getOpenAIConnectionStatus()
      .then((status) => {
        if (!cancelled) {
          setOpenAIStatus(status);
          setStatusErrorMessage(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStatusErrorMessage(
            getErrorMessage(error, "Failed to load provider connection status."),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const providers = React.useMemo<Provider[]>(
    () => [
      {
        name: "OpenAI",
        status: openAIStatus?.connected ? "connected" : "available",
        logo: "openai",
      },
      {
        name: "Anthropic",
        status: "available",
        logo: "anthropic",
        comingSoon: true,
      },
    ],
    [openAIStatus],
  );

  const providerGroups = React.useMemo(
    () =>
      [
        {
          title: "Connected",
          providers: providers.filter((provider) => provider.status === "connected"),
        },
        {
          title: "Available",
          providers: providers.filter((provider) => provider.status === "available"),
        },
      ].filter((group) => group.providers.length > 0),
    [providers],
  );

  return (
    <div className="flex h-full min-h-0 justify-center px-8 pb-8 pt-[47px]">
      <div className="flex w-full max-w-[760px] min-h-0 flex-col pt-8">
        <div className="mb-12">
          <h1 className="text-[22px] text-[#ece5dd]">Providers</h1>
          {statusErrorMessage && (
            <p className="mt-2 max-w-[520px] text-[12px] leading-snug text-[#e9a092]">
              {statusErrorMessage}
            </p>
          )}
        </div>
        <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto pb-8">
          <div className="space-y-8">
            {providerGroups.map((group) => (
              <ProviderGroup
                key={group.title}
                title={group.title}
                providers={group.providers}
                expandedProvider={expandedProvider}
                openAIStatus={openAIStatus}
                onOpenAIStatusChange={setOpenAIStatus}
                onToggleProvider={(provider) =>
                  setExpandedProvider((current) => (current === provider ? null : provider))
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

type ProviderGroupProps = {
  expandedProvider: ProviderLogo | null;
  onOpenAIStatusChange(status: ProviderConnectionStatus): void;
  onToggleProvider(provider: ProviderLogo): void;
  openAIStatus: ProviderConnectionStatus | null;
  title: string;
  providers: Provider[];
};

const ProviderGroup: React.FC<ProviderGroupProps> = ({
  expandedProvider,
  onOpenAIStatusChange,
  onToggleProvider,
  openAIStatus,
  title,
  providers,
}) => {
  return (
    <section>
      <div className="mb-2.5 px-1">
        <h2 className="text-[13px] text-[#d7d0c9]">{title}</h2>
      </div>
      <div className="overflow-hidden rounded-xl border border-[#312c28] bg-[#221f1c]">
        {providers.map((provider, index) => (
          <ProviderRow
            key={provider.name}
            provider={provider}
            showDivider={index < providers.length - 1}
            expanded={expandedProvider === provider.logo}
            openAIStatus={openAIStatus}
            onOpenAIStatusChange={onOpenAIStatusChange}
            onToggleProvider={onToggleProvider}
          />
        ))}
      </div>
    </section>
  );
};

type ProviderRowProps = {
  expanded: boolean;
  onOpenAIStatusChange(status: ProviderConnectionStatus): void;
  onToggleProvider(provider: ProviderLogo): void;
  openAIStatus: ProviderConnectionStatus | null;
  provider: Provider;
  showDivider: boolean;
};

const ProviderRow: React.FC<ProviderRowProps> = ({
  expanded,
  onOpenAIStatusChange,
  onToggleProvider,
  openAIStatus,
  provider,
  showDivider,
}) => {
  const isConnected = provider.status === "connected";
  const isDisabled = provider.comingSoon;
  const canExpand = provider.logo === "openai" && !isDisabled;

  return (
    <div
      className={cx(
        "min-w-0",
        showDivider && "border-b border-[#302a25]",
      )}
    >
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center text-[#f2eeea]">
          <ProviderLogoMark logo={provider.logo} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-[14px] text-[#eee8e2]">{provider.name}</h3>
            {provider.comingSoon && (
              <span className="shrink-0 rounded-full border border-[#3a342f] bg-[#28231f] px-2 py-0.5 text-[10px] font-medium leading-none text-[#a8a098]">
                coming soon
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          disabled={isDisabled}
          aria-expanded={canExpand ? expanded : undefined}
          className={cx(
            "flex h-7 shrink-0 items-center rounded-full px-4 text-[12px] font-medium leading-none transition-colors",
            isDisabled
              ? "cursor-not-allowed border border-[#332e29] bg-[#241f1b] text-[#756e67]"
              : expanded
                ? "border border-[#3a342f] bg-[#28231f] text-[#cfc6bd] hover:border-[#4a443e] hover:bg-[#302a25] hover:text-[#f2eeea]"
                : isConnected
                  ? "border border-[#3a342f] bg-[#28231f] text-[#cfc6bd] hover:border-[#4a443e] hover:bg-[#302a25] hover:text-[#f2eeea]"
                  : "bg-[#ffffff] text-[#1d1a18] hover:bg-[#ebe7e2]",
          )}
          onClick={() => {
            if (canExpand) onToggleProvider(provider.logo);
          }}
        >
          {expanded ? "Close" : isConnected ? "Manage" : "Connect"}
        </button>
      </div>
      {canExpand && (
        <div
          className={cx(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
            expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <OpenAIProviderConnectionDetails
              status={openAIStatus}
              onStatusChange={onOpenAIStatusChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

type ProviderLogoMarkProps = {
  logo: ProviderLogo;
};

const ProviderLogoMark: React.FC<ProviderLogoMarkProps> = ({ logo }) => {
  const sharedProps = {
    "aria-hidden": true,
    className: "h-[15px] w-[15px]",
    fill: "currentColor",
    viewBox: "0 0 24 24",
    xmlns: "http://www.w3.org/2000/svg",
  };

  switch (logo) {
    case "openai":
      return (
        <svg {...sharedProps}>
          <path d="M22.282 9.821a6 6 0 0 0-.516-4.91a6.05 6.05 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a6 6 0 0 0-3.998 2.9a6.05 6.05 0 0 0 .743 7.097a5.98 5.98 0 0 0 .51 4.911a6.05 6.05 0 0 0 6.515 2.9A6 6 0 0 0 13.26 24a6.06 6.06 0 0 0 5.772-4.206a6 6 0 0 0 3.997-2.9a6.06 6.06 0 0 0-.747-7.073M13.26 22.43a4.48 4.48 0 0 1-2.876-1.04l.141-.081l4.779-2.758a.8.8 0 0 0 .392-.681v-6.737l2.02 1.168a.07.07 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494M3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085l4.783 2.759a.77.77 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646M2.34 7.896a4.5 4.5 0 0 1 2.366-1.973V11.6a.77.77 0 0 0 .388.677l5.815 3.354l-2.02 1.168a.08.08 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.08.08 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667m2.01-3.023l-.141-.085l-4.774-2.782a.78.78 0 0 0-.785 0L9.409 9.23V6.897a.07.07 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.8.8 0 0 0-.393.681zm1.097-2.365l2.602-1.5l2.607 1.5v2.999l-2.597 1.5l-2.607-1.5Z" />
        </svg>
      );
    case "anthropic":
      return (
        <svg {...sharedProps}>
          <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
        </svg>
      );
  }
};

export default ProvidersSettingsPanel;
