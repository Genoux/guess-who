import type { ReactNode } from "react";
import { PropCode } from "./prop-code";

/** One rendered example with the props that produce it. */
export function Example({
  code,
  children,
  onDark = false,
}: {
  code: string;
  children: ReactNode;
  onDark?: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      {children}
      <PropCode onDark={onDark}>{code}</PropCode>
    </div>
  );
}
