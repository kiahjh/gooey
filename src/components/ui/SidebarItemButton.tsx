import React from "react";
import cx from "clsx";

type SidebarItemButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

const SidebarItemButton: React.FC<SidebarItemButtonProps> = ({
  active = false,
  className,
  type = "button",
  ...props
}) => {
  return (
    <button
      type={type}
      className={cx(
        "group flex w-full scale-100 items-center rounded-xl px-2 py-1.5 text-left transform-gpu transition-colors transition-transform duration-100 ease-out will-change-transform disabled:cursor-not-allowed disabled:opacity-45",
        active ? "bg-[#312c28]" : "hover:bg-[#201d1a]",
        props.disabled ? "" : "active:scale-[0.98]",
        className,
      )}
      {...props}
    />
  );
};

export default SidebarItemButton;
