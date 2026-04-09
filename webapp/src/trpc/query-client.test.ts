import { describe, expect, it } from "vitest";

import { createQueryClient } from "@/trpc/query-client";

describe("createQueryClient", () => {
  it("uses a 30-second stale time for queries", () => {
    const client = createQueryClient();
    expect(client.getDefaultOptions().queries?.staleTime).toBe(30_000);
  });

  it("round-trips values through configured SuperJSON transformers", () => {
    const client = createQueryClient();
    const serialize = client.getDefaultOptions().dehydrate?.serializeData;
    const deserialize = client.getDefaultOptions().hydrate?.deserializeData;

    expect(serialize).toBeTypeOf("function");
    expect(deserialize).toBeTypeOf("function");

    const payload = {
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      title: "demo",
    };
    expect(deserialize!(serialize!(payload)) as typeof payload).toEqual(payload);
  });

  it("returns a fresh QueryClient instance for each call", () => {
    expect(createQueryClient()).not.toBe(createQueryClient());
  });
});
