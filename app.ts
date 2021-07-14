import { EntityWebhookData, getEntity, EntityProfile } from "./yext.ts";

type DirectoryProfile = EntityProfile & {
  c_directoryParent?: string[];
  c_directoryEntries?: string[];
}

/**
 * Processes a webhook invocation to update a location's directory hierarchy.
 *
 * @param data The webhook payload
 */
export async function handleWebhook(data: EntityWebhookData) {
  console.log("WEBHOOK: ", data.entityId, data.meta);
  console.log("FIELDS: ", Object.keys(data.primaryProfile));
  console.log("PROFILE META: ", data.primaryProfile["meta"]);
  console.log("CHANGED: ", data.changedFields);
  return await updateLocationDirectory(data.entityId);
}

/**
 * Updates the location directory for an entity.
 * 
 * @param id The entity id
 * @returns The result
 */
export async function updateLocationDirectory(id: string) {
  const result = await getEntity<DirectoryProfile>(id);
  return result;
}
