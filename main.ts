import { load, postgres, renderFileToString, serve, serveDir } from "./deps.ts";

await load({
  export: true,
});

const databaseUrl = Deno.env.get("DATABASE_URL")!;
const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

console.log(databaseUrl);
const pool = new postgres.Pool(databaseUrl, 3, true);

serve(async (req: Request) => {
  const { pathname, origin } = new URL(req.url);
  const method = req.method;

  const connection = await pool.connect();
  try {
    if (method == "GET" && pathname == "/") {
      const result = await connection.queryObject`
        SELECT * FROM contest ORDER BY id DESC
      `;
      const param = {
        apps: result.rows,
      };
      console.log(param);
      const body = await renderFileToString(`${Deno.cwd()}/index.ejs`, param);
      return new Response(body, {
        headers: { "content-type": "text/html" },
      });
    } else if (method == "POST" && pathname == "/post") {
      const data = await req.formData();
      const title = data.get("title");
      const description = data.get("description");
      const author = data.get("author");

      const url = "https://api.openai.com/v1/chat/completions";
      const prompt = `
        アプリ名: ${title}
        説明:
        ${description}
        作者: ${author}

        このアプリの感想を述べてください。
      `;

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

      const res = await (await fetch(url, opt as any)).json();

      const comment = res.choices[0].message.content;
      await connection.queryObject`
        INSERT INTO contest (title, description, author, comment) VALUES (${title}, ${description}, ${author}, ${comment});
      `;
      return Response.redirect(origin);
    }
  } finally {
    connection.release();
  }

  return serveDir(req, { fsRoot: "./static/", showIndex: true });
});
