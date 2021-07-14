import { EntityWebhookData, getEntity } from "./yext.ts";

/**
 * Updates a location's directory hierarchy.
 *
 * @param data The webhook payload
 */
export async function updateDirectory(data: EntityWebhookData) {
  console.log("WEBHOOK: ", data.entityId, data.meta);
  console.log("FIELDS: ", Object.keys(data.primaryProfile));
  console.log("PROFILE META: ", data.primaryProfile["meta"]);
  console.log("CHANGED: ", data.changedFields);
  for (const key in data) {
    if (
      key !== "meta" && key !== "entityId" && key !== "primaryProfile" &&
      key !== "languageProfiles" && key !== "changedFields"
    ) {
      console.log("EXTRA: ", key, data[key]);
    }
  }

  const result = await getEntity(data.entityId);
  return result;
}
