import * as yext from "https://deno.land/x/yext_sdk_experiment_2021@v0.0.2/deno/index.ts";

declare var YEXT_API_KEY: string;

const ver = "20210713";

const km = new yext.KnowledgeManagerApi(
  new yext.Configuration({
    apiKey: YEXT_API_KEY,
  }),
);

export async function getEntity(id: string) {
  return await km.knowledgeApiServerGetEntity({
    accountId: "me",
    entityId: id,
    v: ver,
  });
}
