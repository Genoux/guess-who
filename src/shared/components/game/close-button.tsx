"use client";

import { XIcon } from "lucide-react";
import { IconButton, type IconButtonProps } from "./icon-button";

type CloseButtonProps = Omit<IconButtonProps, "icon" | "size">;

/** Round 44px close control for full-screen game moments, with its label as a tooltip. */
export function CloseButton(props: CloseButtonProps) {
  return <IconButton icon={XIcon} {...props} />;
}
