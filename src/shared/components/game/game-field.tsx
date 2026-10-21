"use client";

import { CircleAlertIcon } from "lucide-react";
import { type ComponentProps, type ReactNode, useId } from "react";
import { gameCn } from "./game-cn";

type FieldBase = {
  label: string;
  /** Short line under the field, only when it matters ("Only you see this."). */
  help?: string;
  /** One message for the field; marks it invalid and is announced. */
  error?: string;
  className?: string;
};

type InputFieldProps = FieldBase & { multiline?: false } & Omit<
    ComponentProps<"input">,
    "className"
  >;
type TextareaFieldProps = FieldBase & { multiline: true } & Omit<
    ComponentProps<"textarea">,
    "className"
  >;

export type GameFieldProps = InputFieldProps | TextareaFieldProps;

const controlClass =
  "w-full rounded-field border-[1.5px] border-game-border bg-game-surface px-4.5 font-game-sans text-base text-game-ink outline-none placeholder:text-game-muted focus:border-game-ink aria-invalid:border-game-error read-only:bg-game-sidebar read-only:text-game-muted disabled:bg-game-sidebar disabled:text-game-muted";

/** Label above, input or textarea, help or error below. */
export function GameField(props: GameFieldProps) {
  const generatedId = useId();
  const {
    label,
    help,
    error,
    className,
    id: idProp,
    "aria-describedby": callerDescribedBy,
    "aria-invalid": callerInvalid,
  } = props;
  const id = idProp ?? generatedId;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  // The caller's own description ids come first, then the error and the help line.
  const a11y = {
    id,
    "aria-invalid": error ? true : callerInvalid,
    "aria-describedby":
      [callerDescribedBy, error ? errorId : null, help ? helpId : null].filter(Boolean).join(" ") ||
      undefined,
  };

  let control: ReactNode;
  if (props.multiline) {
    const {
      label: _label,
      help: _help,
      error: _error,
      className: _className,
      multiline: _multiline,
      id: _id,
      "aria-describedby": _describedBy,
      "aria-invalid": _invalid,
      ...rest
    } = props;
    control = (
      <textarea
        {...rest}
        {...a11y}
        className={gameCn(controlClass, "min-h-26 resize-none py-3.5 leading-6")}
      />
    );
  } else {
    const {
      label: _label,
      help: _help,
      error: _error,
      className: _className,
      multiline: _multiline,
      id: _id,
      "aria-describedby": _describedBy,
      "aria-invalid": _invalid,
      type,
      ...rest
    } = props;
    control = (
      <input {...rest} {...a11y} type={type ?? "text"} className={gameCn(controlClass, "h-13")} />
    );
  }

  return (
    <div className={gameCn("flex w-full flex-col gap-2 text-left", className)}>
      <label htmlFor={id} className="font-medium text-game-ink text-small">
        {label}
      </label>
      {control}
      {error ? (
        <span
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 font-medium text-game-error text-small"
        >
          <CircleAlertIcon aria-hidden className="size-4 flex-none" />
          {error}
        </span>
      ) : null}
      {help ? (
        <span id={helpId} className="text-game-muted text-small">
          {help}
        </span>
      ) : null}
    </div>
  );
}
