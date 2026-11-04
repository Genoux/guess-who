import { isAppError } from "@inbeat/core/errors";
import { describe, expect, it, vi } from "vitest";
import { createDeelClient } from "./deel-client";

const person = {
  id: "seed-person-1",
  first_name: "Sam",
  last_name: "Seed",
  full_name: "Sam Seed",
  emails: [{ type: "work", value: "sam@example.test" }],
  hiring_status: "active",
  country: "CA",
  department: { id: "d1", name: "Design (IB)" },
  start_date: "2026-01-05",
};

const reply = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

function clientWith(fetchImpl: typeof fetch) {
  return createDeelClient({
    baseUrl: "https://deel.test/rest/v2",
    token: "token-1",
    fetchImpl,
  });
}

describe("deel client", () => {
  it("reads a person with a bearer token on a GET", async () => {
    const fetchImpl = vi.fn<typeof fetch>(() => reply({ data: person }));
    const found = await clientWith(fetchImpl).getPerson("seed-person-1");

    expect(found?.hiring_status).toBe("active");
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe("https://deel.test/rest/v2/people/seed-person-1");
    expect(init?.method).toBe("GET");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer token-1");
  });

  it("answers null when the person is gone", async () => {
    const found = await clientWith(() => reply({}, 404)).getPerson("gone");
    expect(found).toBeNull();
  });

  it("raises a retryable external_service error on 5xx", async () => {
    const error = await clientWith(() => reply({}, 503))
      .getPerson("x")
      .catch((caught: unknown) => caught);
    expect(isAppError(error, "external_service") && error.isRetryable).toBe(true);
  });

  it("raises a non-retryable external_service error on a response that fails validation", async () => {
    const error = await clientWith(() => reply({ data: { id: 1 } }))
      .getPerson("x")
      .catch((caught: unknown) => caught);
    expect(isAppError(error, "external_service") && error.isRetryable).toBe(false);
  });

  it("raises a timeout error when the request times out", async () => {
    const timedOut = () => Promise.reject(new DOMException("timed out", "TimeoutError"));
    const error = await clientWith(timedOut)
      .getPerson("x")
      .catch((caught: unknown) => caught);
    expect(isAppError(error, "timeout")).toBe(true);
  });

  it("answers null only for a 404", async () => {
    expect(await clientWith(() => reply({}, 404)).getPerson("x")).toBeNull();
  });

  it("raises a permanent external_service error on 400, never null, so nobody is deleted", async () => {
    const error = await clientWith(() => reply({}, 400))
      .getPerson("00000000-0000-0000-0000-000000000000")
      .catch((caught: unknown) => caught);
    expect(isAppError(error, "external_service") && error.isRetryable).toBe(false);
  });

  it("raises a timeout error when the body read times out", async () => {
    const slowBody = () =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.reject(new DOMException("timed out", "TimeoutError")),
      } as Response);
    const error = await clientWith(slowBody)
      .getPerson("x")
      .catch((caught: unknown) => caught);
    expect(isAppError(error, "timeout")).toBe(true);
  });

  it("raises a non-retryable external_service error on a body that is not JSON", async () => {
    const html = () => Promise.resolve(new Response("<html>oops</html>", { status: 200 }));
    const error = await clientWith(html)
      .getPerson("x")
      .catch((caught: unknown) => caught);
    expect(isAppError(error, "external_service") && error.isRetryable).toBe(false);
  });

  it("raises an external_service error when the people list answers 400", async () => {
    const error = await (async () => {
      for await (const _ of clientWith(() => reply({}, 400)).listPeople()) {
        // drain
      }
    })().catch((caught: unknown) => caught);
    expect(isAppError(error, "external_service")).toBe(true);
  });

  it("pages by offset until the total is reached", async () => {
    const page = (offset: number, id: string) =>
      reply({ data: [{ ...person, id }], page: { total_rows: 2, items_per_page: 1, offset } });
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(() => page(0, "seed-person-1"))
      .mockImplementationOnce(() => page(1, "seed-person-2"));

    const ids: string[] = [];
    for await (const listed of clientWith(fetchImpl).listPeople()) ids.push(listed.id);

    expect(ids).toEqual(["seed-person-1", "seed-person-2"]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(String(fetchImpl.mock.calls[1]?.[0])).toContain("offset=1");
  });

  it("stops on an empty page even when the total says more", async () => {
    const fetchImpl = vi.fn<typeof fetch>(() =>
      reply({ data: [], page: { total_rows: 5, items_per_page: 100, offset: 0 } }),
    );
    const ids: string[] = [];
    for await (const listed of clientWith(fetchImpl).listPeople()) ids.push(listed.id);
    expect(ids).toEqual([]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  describe("findPersonByContractId", () => {
    const listing = (...people: object[]) =>
      vi.fn<typeof fetch>(() =>
        reply({
          data: people,
          page: { total_rows: people.length, items_per_page: 100, offset: 0 },
        }),
      );

    it("returns the person whose employments include the contract", async () => {
      const fetchImpl = listing(
        { ...person, id: "p1", employments: [{ id: "c1" }] },
        { ...person, id: "p2", employments: [{ id: "c2" }, { id: "c3" }] },
      );
      expect((await clientWith(fetchImpl).findPersonByContractId("c3"))?.id).toBe("p2");
    });

    it("returns null when no person has the contract", async () => {
      const fetchImpl = listing({ ...person, id: "p1" });
      expect(await clientWith(fetchImpl).findPersonByContractId("c9")).toBeNull();
    });
  });
});
