"use client";

import { type ComponentProps, useId } from "react";
import { gameCn } from "./game-cn";

type FieldBase = {
  label: string;
  /** Short line under the field, only when it matters ("Only you see this."). */
  help?: string;
  /** One message for the field; marks it invalid. */
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
  "w-full rounded-field border-[1.5px] border-game-border bg-game-surface px-4.5 font-game-sans text-base text-game-ink outline-none placeholder:text-game-muted focus:border-game-ink aria-invalid:border-game-found read-only:bg-game-sidebar read-only:text-game-muted disabled:bg-game-sidebar disabled:text-game-muted";

/** Label above, input or textarea, help or error below. */
export function GameField(props: GameFieldProps) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy =
    [props.error ? errorId : null, props.help ? helpId : null].filter(Boolean).join(" ") ||
    undefined;

  const control = (() => {
    if (props.multiline) {
      const { label, help, error, className, multiline, ...rest } = props;
      return (
        <textarea
          {...rest}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={gameCn(controlClass, "min-h-26 resize-none py-3.5 leading-6")}
        />
      );
    }
    const { label, help, error, className, multiline, type, ...rest } = props;
    return (
      <input
        {...rest}
        id={id}
        type={type ?? "text"}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={gameCn(controlClass, "h-13")}
      />
    );
  })();

  return (
    <div className={gameCn("flex w-full flex-col gap-2 text-left", props.className)}>
      <label htmlFor={id} className="font-medium text-small text-game-ink">
        {props.label}
      </label>
      {control}
      {props.error ? (
        <span id={errorId} className="font-medium text-small text-game-ink">
          {props.error}
        </span>
      ) : null}
      {props.help ? (
        <span id={helpId} className="text-small text-game-muted">
          {props.help}
        </span>
      ) : null}
    </div>
  );
}
