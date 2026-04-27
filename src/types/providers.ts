export type ProviderConnectionMethod = "chatgptSubscription";

export type ProviderConnectionStatus = {
  accountId: string | null;
  connected: boolean;
  expiresAt: string | null;
  method: ProviderConnectionMethod | null;
  provider: "openai";
};

