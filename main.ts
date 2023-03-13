import { renderFileToString, serve, serveDir } from "./deps.ts";

serve(async (req: Request) => {
  const { pathname, origin } = new URL(req.url);
  const method = req.method;

  if (method == "GET" && pathname == "/") {
    const param = {};
    const body = await renderFileToString(`${Deno.cwd()}/index.ejs`, param);
    return new Response(body, {
      headers: { "content-type": "text/html" },
    });
  } else if (method == "POST" && pathname == "/post") {
    return Response.redirect(origin);
  }

  return serveDir(req, { fsRoot: "./static/", showIndex: true });
});
