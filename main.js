import { serve } from "https://deno.land/std@0.179.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.179.0/http/file_server.ts";
import { renderFileToString } from "https://deno.land/x/dejs@0.10.3/mod.ts";
import * as postgres from "https://deno.land/x/postgres@v0.14.0/mod.ts";
import { load } from "https://deno.land/std@0.179.0/dotenv/mod.ts";

async function renderPage(tpl, params) {
  const body = await renderFileToString(`${Deno.cwd()}/${tpl}`, params);
  return new Response(body, {
    headers: { "content-type": "text/html" },
  });
}

async function talk(prompt) {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const url = "https://api.openai.com/v1/chat/completions";
  const opt = {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + openaiKey,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: prompt },
      ],
    }),
  };
  const res = await (await fetch(url, opt)).json();
  return res.choices[0].message.content;
}

async function index({ pool }) {
  const conn = await pool.connect();
  try {
    const result = await conn.queryObject`
      SELECT * FROM contest ORDER BY id DESC
    `;
    const apps = result.rows.map((a) => {
      a.comment = a.comment.trim().replaceAll("。", "。\n");
      return a;
    });
    console.log(apps);
    return await renderPage("index.ejs", { apps });
  } finally {
    conn.release();
  }
}

async function postPage() {
  return await renderPage("post.ejs");
}

async function post({ req, pool }) {
  const conn = await pool.connect();
  try {
    const form = await req.formData();
    const title = form.get("title");
    const description = form.get("description");
    const author = form.get("author");

    const prompt = `
    アプリ名: ${title}
    説明:
    ${description}
    作者: ${author}

    このアプリの感想を述べてください。
    `;
    const comment = await talk(prompt);

    await conn.queryObject`
      INSERT INTO contest (title, description, author, comment) VALUES (${title}, ${description}, ${author}, ${comment});
    `;

    const { origin } = new URL(req.url);
    return Response.redirect(origin);
  } finally {
    conn.release();
  }
}

async function main() {
  await load({ export: true });
  const databaseUrl = Deno.env.get("DATABASE_URL");
  const pool = new postgres.Pool(databaseUrl, 3, true);

  const router = new Map();
  router.set("GET /", index);
  router.set("GET /post", postPage);
  router.set("POST /post", post);

  serve(async (req) => {
    const { pathname } = new URL(req.url);
    const path = `${req.method} ${pathname}`;
    const handler = router.get(path);
    if (handler) {
      return await handler({ req, pool });
    }
    return serveDir(req, { fsRoot: "./static/", showIndex: true });
  });
}

await main();
