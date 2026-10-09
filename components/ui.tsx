import type { ReactNode } from "react";

/** "// label" heading row used at the top of most sections. */
export function SecHead({
  label,
  aside,
  className = "",
}: {
  label: string;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`sec-head mono muted ${className}`.trim()}>
      <span data-fx="scramble">{`// ${label}`}</span>
      {aside !== undefined && <span>{aside}</span>}
    </div>
  );
}
