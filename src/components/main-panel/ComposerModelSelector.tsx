import React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import type { ConfiguredProviderModel } from "../../types/providers";

type ComposerModelSelectorProps = {
  loading?: boolean;
  models: ConfiguredProviderModel[];
  onModelChange(modelId: string): void;
  selectedModelId: string | null;
};

const ComposerModelSelector: React.FC<ComposerModelSelectorProps> = ({
  loading = false,
  models,
  onModelChange,
  selectedModelId,
}) => {
  const selectedModel = models.find((model) => model.id === selectedModelId) ?? models[0];
  const hasModels = models.length > 0;
  const [open, setOpen] = React.useState(false);
  const [filterQuery, setFilterQuery] = React.useState("");
  const [activeModelId, setActiveModelId] = React.useState<string | null>(null);
  const [canScrollDown, setCanScrollDown] = React.useState(false);
  const [canScrollUp, setCanScrollUp] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const modelRowRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const activeChangeSourceRef = React.useRef<"keyboard" | "mouse" | "programmatic">("programmatic");
  const filteredModels = React.useMemo(() => {
    const normalizedQuery = filterQuery.trim().toLowerCase();

    if (!normalizedQuery) return models;

    return models.filter((model) =>
      `${model.label} ${model.providerLabel}`.toLowerCase().includes(normalizedQuery),
    );
  }, [filterQuery, models]);

  const updateScrollFades = React.useCallback(() => {
    const scrollArea = scrollAreaRef.current;

    if (!scrollArea) {
      setCanScrollDown(false);
      setCanScrollUp(false);
      return;
    }

    const scrollableDistance = scrollArea.scrollHeight - scrollArea.clientHeight;
    setCanScrollUp(scrollArea.scrollTop > 0);
    setCanScrollDown(scrollArea.scrollTop < scrollableDistance - 1);
  }, []);

  const moveActiveModel = React.useCallback(
    (direction: "down" | "end" | "home" | "up") => {
      if (filteredModels.length === 0) return;

      const currentIndex = filteredModels.findIndex((model) => model.id === activeModelId);
      const fallbackIndex = direction === "up" || direction === "end" ? filteredModels.length - 1 : 0;
      const nextIndex =
        currentIndex === -1
          ? fallbackIndex
          : direction === "home"
            ? 0
            : direction === "end"
              ? filteredModels.length - 1
              : direction === "down"
                ? (currentIndex + 1) % filteredModels.length
                : (currentIndex - 1 + filteredModels.length) % filteredModels.length;

      activeChangeSourceRef.current = "keyboard";
      setActiveModelId(filteredModels[nextIndex].id);
    },
    [activeModelId, filteredModels],
  );

  const commitActiveModel = React.useCallback(() => {
    const activeModel = filteredModels.find((model) => model.id === activeModelId);

    if (!activeModel) return;

    onModelChange(activeModel.id);
    setOpen(false);
  }, [activeModelId, filteredModels, onModelChange]);

  React.useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => {
      activeChangeSourceRef.current = "programmatic";
      setActiveModelId(
        filteredModels.find((model) => model.id === selectedModelId)?.id ??
          filteredModels[0]?.id ??
          null,
      );
      searchInputRef.current?.focus();
      updateScrollFades();
    });

    return () => cancelAnimationFrame(frame);
  }, [filteredModels, open, selectedModelId, updateScrollFades]);

  React.useEffect(() => {
    if (!open) return;

    const scrollArea = scrollAreaRef.current;
    if (scrollArea) scrollArea.scrollTop = 0;
    activeChangeSourceRef.current = "programmatic";
    setActiveModelId(
      filteredModels.find((model) => model.id === selectedModelId)?.id ??
        filteredModels[0]?.id ??
        null,
    );
    updateScrollFades();
  }, [filterQuery, filteredModels, open, selectedModelId, updateScrollFades]);

  React.useEffect(() => {
    if (!open || !activeModelId) return;
    if (activeChangeSourceRef.current === "mouse") return;

    const row = modelRowRefs.current.get(activeModelId);
    row?.scrollIntoView({ block: "nearest" });
    requestAnimationFrame(updateScrollFades);
  }, [activeModelId, open, updateScrollFades]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={!hasModels}
          className="flex h-7 max-w-[210px] items-center gap-1.5 rounded-xl bg-transparent pl-3 pr-2 text-[11px] font-medium leading-none text-[#cfc6bd] transition-colors hover:bg-[#38332e] hover:text-[#f2eeea] disabled:cursor-not-allowed disabled:text-[#756e67] disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6c6258]"
          aria-label="Select model"
        >
          <span className="truncate">
            {selectedModel?.label ?? (loading ? "Loading models" : "No models")}
          </span>
          <ChevronDownIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuPrimitive.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[230px] overflow-hidden rounded-2xl border border-[#3a342f] bg-[#211e1b] p-1 shadow-[0_18px_54px_rgba(0,0,0,0.42)] outline-none data-[side=bottom]:animate-[dropdownIn_120ms_ease-out] data-[side=top]:animate-[dropdownIn_120ms_ease-out]"
        >
          <div className="relative">
            {canScrollUp && (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-gradient-to-b from-[#211e1b] to-transparent" />
            )}
            <div
              ref={scrollAreaRef}
              className="hide-scrollbar max-h-[188px] overflow-y-auto"
              onScroll={updateScrollFades}
            >
              <div role="listbox" aria-label="Models">
                {filteredModels.map((model) => {
                  const isActive = activeModelId === model.id;
                  const isSelected = selectedModelId === model.id;

                  return (
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                    key={model.id}
                      ref={(node) => {
                        if (node) {
                          modelRowRefs.current.set(model.id, node);
                        } else {
                          modelRowRefs.current.delete(model.id);
                        }
                      }}
                      className={`relative flex min-h-8 w-full cursor-default select-none items-center rounded-xl py-1.5 pl-2 pr-8 text-left text-[12px] leading-4 text-[#d8d0c8] outline-none transition-colors ${
                        isActive ? "bg-[#302a25] text-[#f2eeea]" : ""
                      }`}
                      onClick={() => {
                        onModelChange(model.id);
                        setOpen(false);
                      }}
                      onMouseEnter={() => {
                        activeChangeSourceRef.current = "mouse";
                        setActiveModelId(model.id);
                      }}
                    >
                      <span className="mr-2 flex h-4 w-4 shrink-0 items-center justify-center text-[#8f8780]">
                        <ProviderMark provider={model.provider} />
                      </span>
                      <span className="truncate font-medium text-[#f2eeea]">{model.label}</span>
                      {isSelected && (
                        <span className="absolute right-2 flex h-4 w-4 items-center justify-center text-[#f2eeea]">
                          <CheckIcon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.4} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {filteredModels.length === 0 && (
                <div className="px-2 py-2 text-[12px] leading-4 text-[#8f8780]">
                  No matching models
                </div>
              )}
            </div>
            {canScrollDown && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-5 bg-gradient-to-t from-[#211e1b] to-transparent" />
            )}
          </div>
          <div className="mt-1 pt-1">
            <div className="flex h-8 items-center gap-2 rounded-xl bg-[#292520] px-2 text-[#8f8780]">
              <SearchIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
              <input
                ref={searchInputRef}
                value={filterQuery}
                onChange={(event) => setFilterQuery(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    event.stopPropagation();
                    moveActiveModel("down");
                    return;
                  }

                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    event.stopPropagation();
                    moveActiveModel("up");
                    return;
                  }

                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.stopPropagation();
                    commitActiveModel();
                    return;
                  }

                  if (event.key === "Home" && event.metaKey) {
                    event.preventDefault();
                    event.stopPropagation();
                    moveActiveModel("home");
                    return;
                  }

                  if (event.key === "End" && event.metaKey) {
                    event.preventDefault();
                    event.stopPropagation();
                    moveActiveModel("end");
                    return;
                  }

                  if (event.key !== "Escape") {
                    event.stopPropagation();
                  }
                }}
                placeholder="Filter models"
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] leading-none text-[#f2eeea] outline-none placeholder:text-[#6f6760]"
              />
            </div>
          </div>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
};

type ProviderMarkProps = {
  provider: ConfiguredProviderModel["provider"];
};

const ProviderMark: React.FC<ProviderMarkProps> = ({ provider }) => {
  const sharedProps = {
    "aria-hidden": true,
    className: "h-[13px] w-[13px]",
    fill: "currentColor",
    viewBox: "0 0 24 24",
    xmlns: "http://www.w3.org/2000/svg",
  };

  switch (provider) {
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

export default ComposerModelSelector;
