declare var YEXT_API_KEY: string;

interface WebhookData {
  meta: {
    eventType: string;
    uuid: string;
    timestamp: number;
    accountId: string;
    actor: string;
    appSpecificAccountId: string;
  };
  entityId: string;
  primaryProfile: { [field: string]: ProfileValue };
  [other: string]: unknown;
}

type ProfileValue =
  | string
  | number
  | boolean
  | null
  | ProfileValue[]
  | { [k: string]: ProfileValue };

/**
 * Updates a location's directory hierarchy.
 *
 * @param data The webhook payload
 */
export async function updateDirectory(data: WebhookData) {
  console.log("WEBHOOK: ", data.entityId, data.meta);
  console.log("FIELDS: ", Object.keys(data.primaryProfile));
  console.log("PROFILE META: ", data.primaryProfile["meta"]);
  for (const key in data) {
    if (key !== "meta" && key !== "entityId" && key !== "primaryProfile") {
      console.log("EXTRA: ", key, data[key]);
    }
  }

  await Promise.resolve(data);
}
