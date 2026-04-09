import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("combines class names from mixed input types", () => {
    expect( 
      cn("px-2", ["py-1", false && "hidden"], { block: true, hidden: false }),
    ).toBe("px-2 py-1 block");
  });

  it("keeps only the last conflicting Tailwind utility", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});
