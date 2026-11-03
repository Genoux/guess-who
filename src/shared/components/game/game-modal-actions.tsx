import { GameButton } from "./game-button";

type ModalAction = {
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

type GameModalActionsProps = {
  /** The way out: Cancel, Keep it. */
  secondary: ModalAction;
  /** The call to action: Save, OK, Remove. */
  primary: ModalAction;
};

/** The footer of a two-choice dialog: the way out and the action, side by side at equal width. */
export function GameModalActions({ secondary, primary }: GameModalActionsProps) {
  return (
    <div className="flex w-full gap-3">
      <GameButton
        variant="light"
        className="flex-1 px-4"
        type={secondary.type}
        disabled={secondary.disabled}
        onClick={secondary.onClick}
      >
        {secondary.label}
      </GameButton>
      <GameButton
        className="flex-1 px-4"
        type={primary.type}
        disabled={primary.disabled}
        onClick={primary.onClick}
      >
        {primary.label}
      </GameButton>
    </div>
  );
}
