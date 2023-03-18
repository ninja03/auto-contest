import { serve } from "https://deno.land/std@0.179.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.179.0/http/file_server.ts";
import { renderFileToString, Params } from "https://deno.land/x/dejs@0.10.3/mod.ts";
import * as postgres from "https://deno.land/x/postgres@v0.14.0/mod.ts";
import { load } from "https://deno.land/std@0.179.0/dotenv/mod.ts";

interface Context {
  req: Request,
  pool: postgres.Pool
}

interface App {
  title: string;
  description: string;
  author: string;
  comment: string;
}

async function renderPage(tpl: string, params: Params = {}) {
  const body = await renderFileToString(`${Deno.cwd()}/${tpl}`, params);
  return new Response(body, {
    headers: { "content-type": "text/html" },
  });
}

async function talk(prompt: string) {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const url = "https://api.openai.com/v1/chat/completions";
  const opt: RequestInit = {
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

async function index({ pool }: Context) {
  const conn = await pool.connect();
  try {
    const result = await conn.queryObject<App>(`
      SELECT * FROM contest ORDER BY id DESC
    `);
    const apps = result.rows.map((a) => {
      a.comment = a.comment.trim().replaceAll("。", "。\n");
      return a;
    });
    return { apps };
  } finally {
    conn.release();
  }
}

async function post({ req, pool }: Context) {
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

  const conn = await pool.connect();
  try {
    await conn.queryObject(`
      INSERT INTO contest (title, description, author, comment) VALUES (${title}, ${description}, ${author}, ${comment});
    `);
    const { origin } = new URL(req.url);
    return Response.redirect(origin);
  } finally {
    conn.release();
  }
}

function createPool() {
  const databaseUrl = Deno.env.get("DATABASE_URL");
  return new postgres.Pool(databaseUrl, 3, true);
}

async function handler(req: Request) {
  const { pathname } = new URL(req.url);
  const path = `${req.method} ${pathname}`;
  const ctx = { req, pool };
  switch (path) {
    case "GET /": return await renderPage("index.ejs", await index(ctx));
    case "GET /post": return await renderPage("post.ejs");
    case "POST /post": return await post(ctx);
  }
  return serveDir(req, { fsRoot: "./static/" })
}

await load({ export: true });
const pool = createPool();
serve(handler);
