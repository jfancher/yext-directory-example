// Entry point when running with Deno Deploy.
// deno-lint-ignore no-explicit-any
addEventListener("fetch", async (e: any) => {
  e.respondWith(await handle(e.request));
});

async function handle(req: Request) {
  if (req.method !== "POST") {
    return new Response(null, {
      status: 405,
      statusText: "Method Not Allowed",
    });
  }

  const { pathname } = new URL(req.url);
  if (pathname !== "/echo") {
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
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
