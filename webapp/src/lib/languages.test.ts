import { describe, expect, it } from "vitest";

import {
  getLanguageNameForDisplay,
  languageCodes,
  languageNameByCode,
  languageValues,
} from "@/lib/languages";

describe("languageValues", () => {
  it("contains exactly the supported language codes", () => {
    expect(languageValues).toEqual(languageCodes);
  });

  it("does not contain duplicate values", () => {
    expect(new Set(languageValues).size).toBe(languageValues.length);
  });

  it("provides human-readable names for every supported code", () => {
    for (const code of languageCodes) {
      expect(languageNameByCode[code]).toBeTruthy();
      expect(getLanguageNameForDisplay(code)).toBe(languageNameByCode[code]);
    }
  });

  it("supports legacy name values during transition", () => {
    expect(getLanguageNameForDisplay("English")).toBe("English");
    expect(getLanguageNameForDisplay("Spanish")).toBe("Spanish");
  });

  it("falls back to Unknown for unsupported values", () => {
    expect(getLanguageNameForDisplay("made-up-code")).toBe("Unknown");
    expect(getLanguageNameForDisplay(undefined)).toBe("Unknown");
    expect(getLanguageNameForDisplay(null)).toBe("Unknown");
  });
});
