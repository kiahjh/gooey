import React from "react";
import cx from "clsx";

const Kbd: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <kbd
      className={cx(
        "flex h-fit w-fit rounded-full border-[0.5px] border-[#433d38] bg-[#2a2623] px-1.5 py-0.25",
        className,
      )}
    >
      <span className="text-xs tracking-[2px] -mr-[2px] text-[#aca49c]">
        {children}
      </span>
    </kbd>
  );
};

export default Kbd;
