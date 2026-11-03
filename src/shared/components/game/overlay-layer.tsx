"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

const OverlayLayerContext = createContext<HTMLElement | null>(null);

/**
 * Where the shell's overlays are portaled to: a layer at its end, inside the element that carries
 * the page's view transition. In the body they would sit outside it, and the transition would
 * dissolve the bare page while the overlay vanished at once. `null` until the layer is mounted.
 */
export const useOverlayLayer = () => useContext(OverlayLayerContext);

/** Holds the overlay layer; state, not a lookup, so a navigation never finds the old page's. */
export function OverlayLayer({ children }: { children: ReactNode }) {
  const [layer, setLayer] = useState<HTMLElement | null>(null);

  return (
    <OverlayLayerContext value={layer}>
      {children}
      <div ref={setLayer} />
    </OverlayLayerContext>
  );
}
