import React, { useLayoutEffect, useRef, useState } from "react";
import { ArrowUpIcon } from "lucide-react";
import { getConfiguredProviderModels } from "../../lib/backend";
import { getErrorMessage } from "../../lib/errors";
import { useGooeyStore } from "../../state/useGooeyStore";
import type { ConfiguredProviderModel } from "../../types/providers";
import ComposerModelSelector from "./ComposerModelSelector";

const MIN_ROWS = 2;
const MAX_ROWS = 10;
const LINE_HEIGHT = 20;

const PromptComposerShell: React.FC = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeSessionId = useGooeyStore((state) => state.activeSessionId);
  const activeWorkspaceId = useGooeyStore((state) => state.activeWorkspaceId);
  const activeSession = useGooeyStore((state) =>
    state.workspaces
      .find((workspace) => workspace.id === state.activeWorkspaceId)
      ?.sessions.find((session) => session.id === state.activeSessionId) ?? null,
  );
  const sendPrompt = useGooeyStore((state) => state.sendPrompt);
  const [hasText, setHasText] = useState(false);
  const [models, setModels] = useState<ConfiguredProviderModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsErrorMessage, setModelsErrorMessage] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const minHeight = MIN_ROWS * LINE_HEIGHT;
    const maxHeight = MAX_ROWS * LINE_HEIGHT;

    textarea.style.height = `${minHeight}px`;

    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${Math.max(nextHeight, minHeight)}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useLayoutEffect(() => {
    resizeTextarea();
  }, []);

  const submitPrompt = () => {
    const textarea = textareaRef.current;
    const prompt = textarea?.value.trim() ?? "";

    if (!prompt || !selectedModelId || !activeSessionId || activeSession?.status === "working") {
      return;
    }

    if (textarea) {
      textarea.value = "";
      setHasText(false);
      resizeTextarea();
    }

    void sendPrompt({
      modelId: selectedModelId,
      prompt,
      sessionId: activeSessionId,
    });
  };

  React.useEffect(() => {
    let cancelled = false;

    getConfiguredProviderModels()
      .then((nextModels) => {
        if (cancelled) return;

        setModels(nextModels);
        setModelsErrorMessage(null);
        setSelectedModelId((currentModelId) => {
          if (nextModels.length === 0) return null;
          if (nextModels.some((model) => model.id === currentModelId)) return currentModelId;
          return nextModels[0].id;
        });
      })
      .catch((error) => {
        if (cancelled) return;

        setModels([]);
        setSelectedModelId(null);
        setModelsErrorMessage(
          getErrorMessage(error, "Failed to load configured provider models."),
        );
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="prompt-composer mx-auto w-full max-w-[700px]">
      <div className="rounded-[24px] border border-[#37322d] bg-[#2c2926] shadow-[0_24px_72px_rgba(0,0,0,0.28)]">
        <div className="relative px-5 pb-[44px] pt-4">
          <textarea
            ref={textareaRef}
            aria-label="Prompt input"
            rows={MIN_ROWS}
            placeholder="Ask Gooey to do something..."
            disabled={!activeWorkspaceId || !activeSessionId || activeSession?.status === "working"}
            onInput={(event) => {
              resizeTextarea();
              setHasText(event.currentTarget.value.trim().length > 0);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitPrompt();
              }
            }}
            className="w-full resize-none overflow-y-hidden border-0 bg-transparent p-0 text-[13px] leading-5 text-[#ece5dd] outline-none placeholder:text-[#79716a] disabled:cursor-not-allowed disabled:text-[#837a72]"
          />
          <div className="absolute bottom-[8px] right-[8px] flex items-center gap-2">
            <ComposerModelSelector
              loading={modelsLoading}
              models={models}
              selectedModelId={selectedModelId}
              onModelChange={setSelectedModelId}
            />
            <button
              type="button"
              disabled={
                !hasText ||
                !selectedModelId ||
                !activeSessionId ||
                activeSession?.status === "working"
              }
              onClick={submitPrompt}
              className={`flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-[#23201d] transition-colors disabled:cursor-not-allowed ${
                hasText && selectedModelId && activeSessionId && activeSession?.status !== "working"
                  ? "bg-[#ffffff]"
                  : "bg-[#8f8b87]"
              }`}
              aria-label="Send prompt"
            >
              <ArrowUpIcon className="h-[14px] w-[14px]" strokeWidth={2} />
            </button>
          </div>
          {modelsErrorMessage && (
            <p className="absolute bottom-[-20px] right-[8px] max-w-[360px] truncate text-[11px] leading-none text-[#e9a092]">
              {modelsErrorMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptComposerShell;
