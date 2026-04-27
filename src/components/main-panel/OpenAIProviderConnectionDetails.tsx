import React from "react";
import {
  connectOpenAIChatGPTAccount,
  disconnectOpenAIChatGPTAccount,
} from "../../lib/backend";
import { getErrorMessage } from "../../lib/errors";
import type { ProviderConnectionStatus } from "../../types/providers";
import ProviderConnectionMethodOption from "./ProviderConnectionMethodOption";

type OpenAIProviderConnectionDetailsProps = {
  onStatusChange(status: ProviderConnectionStatus): void;
  status: ProviderConnectionStatus | null;
};

const OpenAIProviderConnectionDetails: React.FC<OpenAIProviderConnectionDetailsProps> = ({
  onStatusChange,
  status,
}) => {
  const [pendingAction, setPendingAction] = React.useState<"connect" | "disconnect" | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const isChatGPTConnected = status?.connected && status.method === "chatgptSubscription";
  const isBusy = pendingAction !== null;

  const connectChatGPTAccount = async () => {
    setPendingAction("connect");
    setErrorMessage(null);

    try {
      const nextStatus = await connectOpenAIChatGPTAccount();
      onStatusChange(nextStatus);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to connect ChatGPT account."));
    } finally {
      setPendingAction(null);
    }
  };

  const disconnectChatGPTAccount = async () => {
    setPendingAction("disconnect");
    setErrorMessage(null);

    try {
      const nextStatus = await disconnectOpenAIChatGPTAccount();
      onStatusChange(nextStatus);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to disconnect ChatGPT account."));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="px-3.5 pb-3.5 pt-1">
      <div className="grid gap-2 md:grid-cols-2">
        <ProviderConnectionMethodOption
          actionLabel={
            pendingAction === "connect"
              ? "Waiting"
              : isChatGPTConnected
                ? "Disconnect"
                : "Continue"
          }
          label="ChatGPT account"
          detail="Go, Plus, or Pro"
          disabled={isBusy}
          status={pendingAction === "connect" ? "pending" : isChatGPTConnected ? "connected" : "idle"}
          onAction={isChatGPTConnected ? disconnectChatGPTAccount : connectChatGPTAccount}
        />
        <ProviderConnectionMethodOption
          actionLabel="Enter key"
          label="API key"
          detail="Platform billing"
          disabled
          onAction={() => {}}
        />
      </div>
      {errorMessage && (
        <p className="mt-2 px-1 text-[11px] leading-snug text-[#e9a092]">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default OpenAIProviderConnectionDetails;
