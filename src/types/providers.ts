export type ProviderConnectionMethod = "chatgptSubscription";

export type ProviderConnectionStatus = {
  accountId: string | null;
  connected: boolean;
  expiresAt: string | null;
  method: ProviderConnectionMethod | null;
  provider: "openai";
};

export type ConfiguredProviderModel = {
  id: string;
  label: string;
  provider: "anthropic" | "openai";
  providerLabel: string;
};
