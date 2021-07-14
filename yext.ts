export interface EntityProfile {
  [field: string]: ProfileValue;
}

export type ProfileValue =
  | string
  | number
  | boolean
  | null
  | ProfileValue[]
  | { [k: string]: ProfileValue };

export interface EntityWebhookData {
  meta: {
    eventType: string;
    uuid: string;
    timestamp: number;
    accountId: string;
    actor: string;
    appSpecificAccountId: string;
  };
  entityId: string;
  primaryProfile: EntityProfile;
  languageProfiles: EntityProfile[];
  changedFields: {
    language: string;
    fieldNames: string[];
  };
  [other: string]: unknown; // TODO: remove
}

declare var YEXT_API_KEY: string;
const API_BASE = "https://qa.yext.com/v2/accounts/me";
const VER = "20210714";

function buildUrl(path: string) {
  const result = new URL(path, API_BASE);
  result.searchParams.append("api_key", YEXT_API_KEY);
  result.searchParams.append("v", VER);
  return result;
}

export async function getEntity(id: string) {
  const url = buildUrl(`entities/${id}`);
  const response = await fetch(url);
  if (response.status < 200 || response.status >= 300) {
    throw response;
  }
  return await response.json();
}
