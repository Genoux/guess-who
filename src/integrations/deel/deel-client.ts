import "server-only";
import { AppError } from "@inbeat/core/errors";
import type { z } from "zod";
import { logger } from "@/shared/lib/logger";
import { type DeelPerson, deelPeoplePageSchema, deelPersonResponseSchema } from "./deel-person";

const REQUEST_TIMEOUT_MS = 10_000;
const PAGE_SIZE = 100;

type DeelClientOptions = {
  baseUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
};

const isTimeout = (error: unknown) =>
  error instanceof DOMException && error.name === "TimeoutError";

// The timeout signal also covers the body read, so a slow body times out like a slow request.
async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    if (isTimeout(error)) throw new AppError("timeout", "deel body timed out", { cause: error });
    throw new AppError("external_service", "deel body is not json", {
      cause: error,
      isRetryable: false,
    });
  }
}

export function createDeelClient({ baseUrl, token, fetchImpl = fetch }: DeelClientOptions) {
  async function get<Schema extends z.ZodType>(
    path: string,
    schema: Schema,
    notFoundStatuses: readonly number[] = [],
  ): Promise<z.infer<Schema> | null> {
    let response: Response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method: "GET",
        headers: { authorization: `Bearer ${token}`, accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      if (isTimeout(error)) {
        throw new AppError("timeout", "deel request timed out", { cause: error });
      }
      throw new AppError("external_service", "deel request failed", {
        cause: error,
        isRetryable: true,
      });
    }

    if (notFoundStatuses.includes(response.status)) return null;
    if (!response.ok) {
      throw new AppError("external_service", `deel answered ${response.status}`, {
        isRetryable: response.status >= 500 || response.status === 429,
      });
    }

    const parsed = schema.safeParse(await readJson(response));
    if (!parsed.success) {
      logger.warn("deel response failed validation", {
        paths: parsed.error.issues.map(({ path }) => path.join(".")),
      });
      throw new AppError("external_service", "deel response failed validation", {
        isRetryable: false,
      });
    }
    return parsed.data;
  }

  async function* listPeople(): AsyncGenerator<DeelPerson> {
    let offset = 0;
    while (true) {
      const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      const page = await get(`/people?${query}`, deelPeoplePageSchema);
      if (!page) return;
      yield* page.data;
      offset += page.data.length;
      if (page.data.length === 0 || offset >= page.page.total_rows) return;
    }
  }

  return {
    async getPerson(deelId: string): Promise<DeelPerson | null> {
      // Deel answered 400, not 404, for an unknown well-formed uuid.
      const found = await get(
        `/people/${encodeURIComponent(deelId)}`,
        deelPersonResponseSchema,
        [404, 400],
      );
      return found?.data ?? null;
    },

    listPeople,

    // Deel gives no contract-to-person lookup for our token, so contract events scan the list.
    async findPersonByContractId(contractId: string): Promise<DeelPerson | null> {
      for await (const person of listPeople()) {
        if (person.employments.some(({ id }) => id === contractId)) return person;
      }
      return null;
    },
  };
}

export type DeelClient = ReturnType<typeof createDeelClient>;
