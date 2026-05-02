export interface MustIncludeException {
  countryIso: string;
  languageId: string;
  reason?: string;
}

export const EXCEPTIONS: MustIncludeException[] = [];
