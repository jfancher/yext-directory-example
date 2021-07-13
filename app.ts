declare var YEXT_API_KEY: string;

/**
 * Updates a location's directory hierarchy.
 *
 * @param data The webhook payload
 */
export async function updateDirectory(data: unknown) {
  console.log(data);
  console.log(`key: ${YEXT_API_KEY ? "set" : "unset"}`);
  await Promise.resolve(data);
}
