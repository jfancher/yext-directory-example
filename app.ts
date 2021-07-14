import {
  createEntity,
  deleteEntity,
  EntityProfile,
  EntityWebhookData,
  getEntity,
  updateEntity,
} from "./yext.ts";

type DirectoryProfile = EntityProfile & {
  c_directoryParent?: string[];
  c_directoryEntries?: string[];
  c_directoryTimestamp?: string;
};

interface DirectoryUpdate {
  id: string;
  region: string;
  city: string;
  applied: DirectoryUpdateAction[];
}

interface DirectoryUpdateAction {
  id: string;
  kind: "create" | "update" | "delete";
  data: DirectoryProfile;
}

/**
 * Processes a webhook invocation to update a location's directory hierarchy.
 *
 * @param data The webhook payload
 */
export async function handleWebhook(data: EntityWebhookData) {
  const type = data.meta.eventType;
  if (type === "CREATE_ENTITY" || type === "UPDATE_ENTITY") {
    return await updateLocationDirectory(data.entityId);
  }
  return null;
}

/**
 * Updates the location directory for an entity.
 *
 * @param id The entity id
 * @param dry Dry run
 * @returns The result
 */
export async function updateLocationDirectory(id: string, dry?: boolean) {
  console.log(`processing update for ${id}`);

  let doUpdate = updateEntity;
  let doCreate = createEntity;
  let doDelete = deleteEntity;
  if (dry) {
    doUpdate = mockUpdateEntity;
    doCreate = mockCreateEntity;
    doDelete = mockDeleteEntity;
  }

  let entity = await getEntity<DirectoryProfile>(id);
  if (!entity) {
    throw new Error(`${id} not found`);
  }

  const city = entity.address?.city ?? "";
  const region = entity.address?.region ?? "";
  const result: DirectoryUpdate = { id, region, city, applied: [] };

  if (entity.meta?.entityType !== "location") {
    console.log(`${id} is ${entity.meta?.entityType}, not location; ignoring`);
    return result;
  }

  const cityId = cityDirectoryId(city, region);
  const oldCityId = entity.c_directoryParent?.[0] ?? "";

  console.log(`  current: ${oldCityId}, expected: ${cityId}`);
  if (cityId === oldCityId) {
    return result;
  }

  // before updating the location, ensure its city's directory is up-to-date
  let cityEntity = await getEntity<DirectoryProfile>(cityId);
  if (!cityEntity) {
    // before updating the city, ensure its region's directory is up-to-date
    const regionId = regionDirectoryId(region);
    let regionEntity = await getEntity<DirectoryProfile>(regionId);
    if (!regionEntity) {
      // before making _any_ changes, ensure the directory exists at all
      let rootEntity = await getEntity<DirectoryProfile>(ROOT_ID);
      if (!rootEntity) {
        throw new Error("Directory root not found");
      }

      // create the region entity
      console.log(`  region ${regionId} does not exist, creating`);
      const body = newEntity(`Directory > ${region}`, ROOT_ID);
      regionEntity = await doCreate(regionId, "ce_directoryRegion", body);
      result.applied.push({ id: regionId, kind: "create", data: body });

      // add the forward ref from root to region
      if (!rootEntity?.c_directoryEntries?.includes(region)) {
        console.log(`  adding ${regionId} to directory root`);
        const body = addChildUpdate(rootEntity, regionId);
        rootEntity = await doUpdate(ROOT_ID, body);
        result.applied.push({ id: ROOT_ID, kind: "update", data: body });
      }
    }

    // create the city entry
    console.log(`  city ${cityId} does not exist, creating`);
    const body = newEntity(`Directory > ${region} > ${city}`, regionId);
    cityEntity = await doCreate(cityId, "ce_directoryLocality", body);
    result.applied.push({ id: cityId, kind: "create", data: body });

    // add the forward ref from region to city
    if (!regionEntity?.c_directoryEntries?.includes(cityId)) {
      console.log(`  adding ${cityId} to ${regionId}`);
      const body = addChildUpdate(regionEntity, cityId);
      regionEntity = await doUpdate(regionId, body);
      result.applied.push({ id: regionId, kind: "update", data: body });
    }
  }

  // update the backward ref from location to city
  console.log(`  setting parent of ${id} to ${cityId}`);
  const body = parentUpdate(cityId);
  entity = await doUpdate(id, body);
  result.applied.push({ id, kind: "update", data: body });

  // add the forward ref from city to location
  if (!cityEntity?.c_directoryEntries?.includes(id)) {
    console.log(`  adding ${id} to ${cityId}`);
    const body = addChildUpdate(cityEntity, id);
    cityEntity = await doUpdate(cityId, body);
    result.applied.push({ id: cityId, kind: "update", data: body });
  }

  // if the region/city has changed, clean up the old data
  if (!oldCityId) {
    return result;
  }

  let oldCityEntity = await getEntity<DirectoryProfile>(oldCityId);
  if (!oldCityEntity) {
    console.log(`  old city ${cityId} not found, ignoring`);
    return result;
  }

  // remove the forward ref from city to location
  if (oldCityEntity?.c_directoryEntries?.includes(id)) {
    console.log(`  removing ${id} from ${oldCityId}`);
    const body = removeChildUpdate(oldCityEntity, id);
    oldCityEntity = await doUpdate(oldCityId, body);
    result.applied.push({ id: oldCityId, kind: "update", data: body });
  }

  // delete the old city if it's now empty
  if (!oldCityEntity?.c_directoryEntries?.length) {
    const oldRegionId = oldCityEntity?.c_directoryParent?.[0];

    console.log(`  deleting empty directory ${oldCityId}`);
    await doDelete(oldCityId);
    result.applied.push({ id: oldCityId, kind: "delete", data: {} });

    // the forward ref from old region to old city will be deleted automatically
    // but if the old region is now empty, delete it too
    if (oldRegionId) {
      let oldRegionEntity = await getEntity<DirectoryProfile>(oldRegionId);
      if (oldRegionEntity?.c_directoryEntries?.length) {
        console.log(`  deleting empty directory ${oldRegionId}`);
        await doDelete(oldRegionId);
        result.applied.push({ id: oldRegionId, kind: "delete", data: {} });
      }
    }
  }

  return result;
}

const ROOT_ID = "dir-root";

function cityDirectoryId(city: string, region: string) {
  if (!city || !region) {
    return "";
  }
  return `dir-${formatId(region)}-${formatId(city)}`;
}

function regionDirectoryId(region: string) {
  if (!region) {
    return "";
  }
  return `dir-${formatId(region)}`;
}

function formatId(s: string) {
  return s.toLowerCase().replaceAll(/[^a-z]/g, "");
}

function newEntity(name: string, parent: string): DirectoryProfile {
  return {
    name,
    c_directoryParent: [parent],
    c_directoryTimestamp: new Date().toISOString(),
  };
}

function addChildUpdate(cur: DirectoryProfile, ref: string): DirectoryProfile {
  const result = [ref];
  if (cur.c_directoryEntries) {
    result.push(...cur.c_directoryEntries);
  }
  result.sort();
  return {
    c_directoryEntries: result,
    c_directoryTimestamp: new Date().toISOString(),
  };
}

function removeChildUpdate(
  cur: DirectoryProfile,
  ref: string,
): DirectoryProfile {
  const result = cur.c_directoryEntries?.filter((v) => v !== ref) ?? [];
  result.sort();
  return {
    c_directoryEntries: result,
    c_directoryTimestamp: new Date().toISOString(),
  };
}

function parentUpdate(ref: string): DirectoryProfile {
  return {
    c_directoryParent: [ref],
    c_directoryTimestamp: new Date().toISOString(),
  };
}

const mockUpdateEntity: typeof updateEntity = (_, body) =>
  Promise.resolve(body as any);

const mockCreateEntity: typeof createEntity = (id, entityType, body) => {
  const result = {
    ...body,
    meta: { ...body.meta, id, entityType },
  };
  return Promise.resolve(result as any);
};

const mockDeleteEntity: typeof deleteEntity = () => Promise.resolve(true);
