import { updateDirectory } from "./app.ts";

// Entry point when running with Deno Deploy.
// deno-lint-ignore no-explicit-any
addEventListener("fetch", async (e: any) => {
  try {
    e.respondWith(await handle(e.request));
  } catch (e) {
    e.respondWith(
      new Response(Deno.inspect(e), {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }),
    );
  }
});

Object.assign(globalThis, Deno.env.toObject());

async function handle(req: Request) {
  if (req.method !== "POST") {
    return new Response(null, {
      status: 405,
      statusText: "Method Not Allowed",
    });
  }

  const { pathname } = new URL(req.url);
  if (pathname !== "/update") {
    return new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  if (!req.headers.get("Content-Type")?.includes("application/json")) {
    return new Response(null, {
      status: 415,
      statusText: "Unsupported Media Type",
    });
  }

  const body = await req.json();
  const result = await updateDirectory(body);
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
