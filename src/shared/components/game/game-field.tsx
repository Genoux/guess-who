"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@inbeat/ui/components/select";
import { CircleAlertIcon } from "lucide-react";
import { type ComponentProps, type ReactNode, type Ref, useId } from "react";
import { gameCn } from "./game-cn";

type FieldBase = {
  label: string;
  /** Keeps the label for screen readers only, when a visible heading already names the field. */
  hideLabel?: boolean;
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

export type GameFieldOption = {
  value: string;
  label: string;
  /** A team or status color, shown as a dot beside the label. */
  color?: string;
};

type SelectFieldProps = FieldBase & {
  multiline?: false;
  options: readonly GameFieldOption[];
  /** Shown while no option is chosen. */
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Submitted with a surrounding form. */
  name?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  ref?: Ref<HTMLButtonElement>;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
};

export type GameFieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps;

export const GAME_CONTROL_CLASS =
  "w-full rounded-field border-[1.5px] border-game-border bg-game-surface px-4.5 font-game-sans text-base text-game-ink outline-none placeholder:text-game-muted focus:border-game-ink aria-invalid:border-game-error read-only:bg-game-sidebar read-only:text-game-muted disabled:bg-game-sidebar disabled:text-game-muted";

// toolkit-gap: the select trigger and items take their look from classes with no game variant, so
// the game look wins through important modifiers.
const SELECT_TRIGGER_CLASS =
  "h-13! w-full! min-w-0! gap-3 rounded-field! border-[1.5px]! border-game-border! bg-game-surface! px-4.5! py-0! font-game-sans text-base! text-game-ink data-placeholder:text-game-muted! focus-visible:border-game-ink! focus-visible:ring-0! aria-invalid:border-game-error! aria-invalid:ring-0! disabled:cursor-not-allowed disabled:bg-game-sidebar! disabled:text-game-muted! disabled:opacity-100! [&_svg]:size-4! [&_svg]:text-game-muted! [&_svg]:opacity-100!";

const SELECT_CONTENT_CLASS =
  "z-60 w-max min-w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)] rounded-game-lg! border-0! bg-game-surface! p-0 font-game-sans text-game-ink shadow-pop";

const SELECT_ITEM_CLASS =
  "h-11 gap-3 whitespace-nowrap rounded-game-md py-0 pr-9 pl-3 text-base focus:bg-game-sidebar! focus:text-game-ink! data-[state=checked]:font-medium";

const colorDot = (color: string) => (
  <span aria-hidden className="size-2 flex-none rounded-full" style={{ backgroundColor: color }} />
);

type FieldFrameProps = FieldBase & {
  id: string;
  /** What the label points at is wired by the caller; the frame adds the label, error and help. */
  children: ReactNode;
};

/** Label above, the control, then the error and the help line. */
export function FieldFrame({
  id,
  label,
  hideLabel,
  help,
  error,
  className,
  children,
}: FieldFrameProps) {
  return (
    <div className={gameCn("flex w-full flex-col gap-2 text-left", className)}>
      <label
        htmlFor={id}
        className={gameCn("font-medium text-game-ink text-small", hideLabel && "sr-only")}
      >
        {label}
      </label>
      {children}
      {error ? (
        <span
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-1.5 font-medium text-game-error text-small"
        >
          <CircleAlertIcon aria-hidden className="size-4 flex-none" />
          {error}
        </span>
      ) : null}
      {help ? (
        <span id={`${id}-help`} className="text-game-muted text-small">
          {help}
        </span>
      ) : null}
    </div>
  );
}

/** The ids a control names in aria-describedby, in the order the frame renders them. */
export function describedBy(
  id: string,
  { help, error }: Pick<FieldBase, "help" | "error">,
  caller?: string,
) {
  return (
    [caller, error ? `${id}-error` : null, help ? `${id}-help` : null].filter(Boolean).join(" ") ||
    undefined
  );
}

/** Label above, input, textarea or select, help or error below. */
export function GameField(props: GameFieldProps) {
  const generatedId = useId();
  const {
    label,
    hideLabel,
    help,
    error,
    className,
    id: idProp,
    "aria-describedby": callerDescribedBy,
    "aria-invalid": callerInvalid,
  } = props;
  const id = idProp ?? generatedId;
  const a11y = {
    id,
    "aria-invalid": error ? true : callerInvalid,
    "aria-describedby": describedBy(id, { help, error }, callerDescribedBy),
  };

  let control: ReactNode;
  if (props.multiline) {
    const {
      label: _label,
      hideLabel: _hideLabel,
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
        className={gameCn(GAME_CONTROL_CLASS, "min-h-26 resize-none py-3.5 leading-6")}
      />
    );
  } else if ("options" in props) {
    const {
      options,
      placeholder,
      value,
      defaultValue,
      onValueChange,
      name,
      disabled,
      required,
      ref,
    } = props;
    control = (
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        name={name}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger ref={ref} {...a11y} className={SELECT_TRIGGER_CLASS}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          position="popper"
          align="start"
          sideOffset={8}
          className={SELECT_CONTENT_CLASS}
        >
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className={SELECT_ITEM_CLASS}>
              {option.color ? colorDot(option.color) : null}
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  } else {
    const {
      label: _label,
      hideLabel: _hideLabel,
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
      <input
        {...rest}
        {...a11y}
        type={type ?? "text"}
        className={gameCn(GAME_CONTROL_CLASS, "h-13")}
      />
    );
  }

  return (
    <FieldFrame
      id={id}
      label={label}
      hideLabel={hideLabel}
      help={help}
      error={error}
      className={className}
    >
      {control}
    </FieldFrame>
  );
}
