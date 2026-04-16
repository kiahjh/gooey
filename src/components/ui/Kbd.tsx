import React from "react";
import cx from "clsx";

const Kbd: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <kbd
      className={cx(
        "bg-mauve-300 flex h-fit w-fit rounded-full px-1.5 py-0.25 border-[0.5px] border-mauve-400",
        className,
      )}
    >
      <span className="text-xs tracking-[2px] -mr-[2px] text-mauve-700">
        {children}
      </span>
    </kbd>
  );
};

export default Kbd;
