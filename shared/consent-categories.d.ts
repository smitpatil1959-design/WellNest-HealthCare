export function normalizeConsentCategory(value: unknown): string;
export function normalizeConsentCategories(value: unknown): string;
export function consentCategoriesForRole(role: unknown): string;
export function grantAllowsConsentCategory(
  grantOrCategories: { categories?: unknown } | string | null | undefined,
  category: string,
): boolean;
