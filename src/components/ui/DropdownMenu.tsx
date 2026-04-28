import React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import cx from "clsx";
import { CheckIcon } from "lucide-react";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

type DropdownMenuContentProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Content
>;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>(({ align = "end", className, sideOffset = 8, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cx(
        "z-50 min-w-[220px] overflow-hidden rounded-2xl border border-[#3a342f] bg-[#211e1b] p-1 shadow-[0_18px_54px_rgba(0,0,0,0.42)] outline-none",
        "data-[side=bottom]:animate-[dropdownIn_120ms_ease-out] data-[side=top]:animate-[dropdownIn_120ms_ease-out]",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));

DropdownMenuContent.displayName = "DropdownMenuContent";

type DropdownMenuItemProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Item
>;

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cx(
      "relative flex min-h-8 cursor-default select-none items-center rounded-xl px-2.5 py-1.5 text-[12px] leading-4 text-[#d8d0c8] outline-none transition-colors",
      "data-[disabled]:pointer-events-none data-[disabled]:text-[#756e67] data-[highlighted]:bg-[#302a25] data-[highlighted]:text-[#f2eeea]",
      className,
    )}
    {...props}
  />
));

DropdownMenuItem.displayName = "DropdownMenuItem";

type DropdownMenuRadioItemProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.RadioItem
>;

export const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  DropdownMenuRadioItemProps
>(({ children, className, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cx(
      "relative flex min-h-8 cursor-default select-none items-center rounded-xl py-1.5 pl-2 pr-8 text-[12px] leading-4 text-[#d8d0c8] outline-none transition-colors",
      "data-[disabled]:pointer-events-none data-[disabled]:text-[#756e67] data-[highlighted]:bg-[#302a25] data-[highlighted]:text-[#f2eeea]",
      className,
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-4 w-4 items-center justify-center text-[#f2eeea]">
      <DropdownMenuPrimitive.ItemIndicator>
        <CheckIcon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.4} />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));

DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

type DropdownMenuLabelProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Label
>;

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  DropdownMenuLabelProps
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cx(
      "px-2.5 pb-1.5 pt-2 text-[11px] font-medium leading-none text-[#8f8780]",
      className,
    )}
    {...props}
  />
));

DropdownMenuLabel.displayName = "DropdownMenuLabel";

type DropdownMenuSeparatorProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Separator
>;

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  DropdownMenuSeparatorProps
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cx("my-1 h-px bg-[#332e29]", className)}
    {...props}
  />
));

DropdownMenuSeparator.displayName = "DropdownMenuSeparator";
