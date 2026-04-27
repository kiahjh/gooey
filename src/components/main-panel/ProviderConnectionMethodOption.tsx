import React from "react";
import cx from "clsx";

type ProviderConnectionMethodOptionProps = {
  actionLabel: string;
  detail: string;
  disabled?: boolean;
  label: string;
  meta?: string;
  onAction(): void;
  status?: "idle" | "connected" | "pending";
};

const ProviderConnectionMethodOption: React.FC<ProviderConnectionMethodOptionProps> = ({
  actionLabel,
  detail,
  disabled = false,
  label,
  meta,
  onAction,
  status = "idle",
}) => {
  const isConnected = status === "connected";

  return (
    <article
      className={cx(
        "rounded-2xl border bg-[#1d1a17] px-3 py-2.5 transition-colors",
        isConnected ? "border-[#4b5a43]" : "border-[#332e29]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-[13px] font-medium leading-tight text-[#f2eeea]">
              {label}
            </h3>
            {isConnected && (
              <span className="shrink-0 self-center rounded-md border border-[#4b5a43] bg-[#283024] px-2 py-[2px] text-[10px] font-medium leading-none text-[#c0d6b5]">
                <span className="relative -top-px">connected</span>
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[11px] leading-tight text-[#8f8780]">
            {meta || detail}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          className={cx(
            "flex h-7 shrink-0 items-center rounded-full border px-3 text-[11px] font-medium leading-none transition-colors",
            disabled
              ? "cursor-not-allowed border-[#332e29] bg-[#241f1b] text-[#756e67]"
              : isConnected
                ? "border-[#3a342f] bg-transparent text-[#bcb2a8] hover:border-[#594f47] hover:text-[#f2eeea]"
                : "border-[#3a342f] bg-[#28231f] text-[#cfc6bd] hover:border-[#4a443e] hover:bg-[#302a25] hover:text-[#f2eeea]",
          )}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
};

export default ProviderConnectionMethodOption;
