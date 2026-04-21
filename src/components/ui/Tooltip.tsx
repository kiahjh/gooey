import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

type TooltipProps = {
  children: React.ReactElement;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
};

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  side = "bottom",
  align = "center",
}) => {
  return (
    <TooltipPrimitive.Provider delayDuration={180}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={4}
            className="z-50 rounded-lg border border-[#332d27] bg-[#1f1b18] px-2 py-1 text-[12px] tracking-[-0.01em] text-[#e6dfd8] shadow-[0_10px_30px_-18px_rgba(0,0,0,0.7)] data-[state=closed]:animate-out data-[state=delayed-open]:animate-in data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0"
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

export default Tooltip;
