import azureLanguages from "@/lib/azure-languages.json";

export const languageCodes = [
  "zh-Hans",
  "en",
  "ja",
  "ko",
  "de",
  "fr",
  "ru",
  "pt",
  "es",
  "it",
] as const;

export type LanguageCode = (typeof languageCodes)[number];

type AzureLanguageRecord = {
  name: string;
  native_name: string;
  script: string | null;
  dir: "ltr" | "rtl";
};

type AzureLanguages = Record<string, AzureLanguageRecord>;

const azureLanguageMap = azureLanguages as AzureLanguages;

const resolveLanguageName = (code: LanguageCode) =>
  azureLanguageMap[code]?.name ?? code;

export const languageNameByCode: Record<LanguageCode, string> =
  languageCodes.reduce(
    (acc, code) => {
      acc[code] = resolveLanguageName(code);
      return acc;
    },
    {} as Record<LanguageCode, string>,
  );

export const languageValues = languageCodes;

export const languageOptions = languageCodes.map((code) => ({
  code,
  name: languageNameByCode[code],
}));

const legacyLanguageNameByCode = {
  Chinese: "Chinese",
  English: "English",
  Japanese: "Japanese",
  Korean: "Korean",
  German: "German",
  French: "French",
  Russian: "Russian",
  Portuguese: "Portuguese",
  Spanish: "Spanish",
  Italian: "Italian",
} as const;

export const getLanguageNameForDisplay = (value: string | null | undefined) => {
  if (!value) return "Unknown";
  if (value in languageNameByCode) {
    return languageNameByCode[value as LanguageCode];
  }
  if (value in legacyLanguageNameByCode) {
    return legacyLanguageNameByCode[
      value as keyof typeof legacyLanguageNameByCode
    ];
  }
  return "Unknown";
};
