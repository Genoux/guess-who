import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { wait } from "./wait";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("wait", () => {
  it("resolves once the seconds have passed", async () => {
    const done = vi.fn();
    void wait(1.5).then(done);
    await vi.advanceTimersByTimeAsync(1499);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalledOnce();
  });
});
