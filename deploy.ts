import { handleWebhook, updateLocationDirectory } from "./app.ts";

// Entry point when running with Deno Deploy.
// deno-lint-ignore no-explicit-any
addEventListener("fetch", async (evt: any) => {
  try {
    evt.respondWith(await handle(evt.request));
  } catch (e) {
    evt.respondWith(
      new Response(Deno.inspect(e), {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }),
    );
  }
});

Object.assign(globalThis, Deno.env.toObject());

async function handle(req: Request) {
  const url = new URL(req.url);

  if (req.method === "GET" && url.pathname === "/test") {
    const id = url.searchParams.get("id");
    if (!id) {
      return fail(400, "Bad Request");
    }
    const result = await updateLocationDirectory(id);
    return json(result);
  }

  if (req.method === "POST" && url.pathname === "/update") {
    if (!req.headers.get("Content-Type")?.includes("application/json")) {
      return fail(415, "Unsupported Media Type");
    }
    const result = await handleWebhook(await req.json());
    return json(result);
  }

  return fail(404, "Not Found");
}

function fail(status: number, statusText: string) {
  return new Response(null, { status, statusText });
}

function json(result: unknown) {
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
