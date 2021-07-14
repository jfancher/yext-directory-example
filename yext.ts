export interface EntityProfile {
  [field: string]: ProfileValue;

  meta?: {
    accountId: string;
    uid: string;
    id: string;
    timestamp: string;
    folderId: string;
    language: string;
    countryCode: string;
    entityType: string;
  };

  name?: string;

  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    countryCode?: string;
  };
}

export type ProfileValue =
  | string
  | number
  | boolean
  | null
  | undefined
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
}

export interface ApiResponse<T> {
  meta: {
    uuid: string;
    errors: {
      code: number;
      message: string;
      type: string;
    }[];
  };
  response: T;
}

declare var YEXT_API_KEY: string;
const API_BASE = "https://qa.yext.com/v2/accounts/me/";
const VER = "20210714";

function buildUrl(path: string, params?: Record<string, string>) {
  const result = new URL(path, API_BASE);
  result.searchParams.append("api_key", YEXT_API_KEY);
  result.searchParams.append("v", VER);
  for (const k in params) {
    result.searchParams.append(k, params[k]);
  }
  return result.toString();
}

export async function getEntity<T extends EntityProfile>(
  id: string,
): Promise<T | null> {
  const url = buildUrl(`entities/${id}`);
  const response = await fetch(url);
  if (response.status === 404) {
    return null;
  } else if (response.status < 200 || response.status >= 300) {
    throw response;
  }
  const body = await response.json() as ApiResponse<T>;
  return body.response;
}

export async function updateEntity<T extends EntityProfile>(
  id: string,
  body: EntityProfile,
): Promise<T> {
  const req = new Request(buildUrl(`entities/${id}`), {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
  const response = await fetch(req);
  if (response.status < 200 || response.status >= 300) {
    throw response;
  }
  const responseBody = await response.json() as ApiResponse<T>;
  return responseBody.response;
}

export async function createEntity<T extends EntityProfile>(
  id: string,
  entityType: string,
  body: EntityProfile,
): Promise<T> {
  const req = new Request(buildUrl(`entities`, { entityType }), {
    method: "POST",
    body: JSON.stringify({
      ...body,
      meta: { ...body.meta, id },
    }),
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
  const response = await fetch(req);
  if (response.status < 200 || response.status >= 300) {
    throw response;
  }
  const responseBody = await response.json() as ApiResponse<T>;
  return responseBody.response;
}

export async function deleteEntity(id: string): Promise<boolean> {
  const req = new Request(buildUrl(`entities/${id}`), {
    method: "DELETE",
  });
  const response = await fetch(req);
  if (response.status === 404) {
    return false;
  }
  if (response.status < 200 || response.status >= 300) {
    throw response;
  }
  return true;
}
