import { Handlers, PageProps } from "$fresh/server.ts";
import { pool } from "../utils/db.ts";
import { App } from "../utils/types.ts";
import { AppDiv } from "../components/AppDiv.tsx";

export const handler: Handlers<App[]> = {
  async GET(req, ctx) {
    const conn = await pool.connect();
    try {
      const result = await conn.queryObject<App>(`
        SELECT * FROM contest ORDER BY id DESC
      `);
      const apps = result.rows.map((a) => {
        a.comment = a.comment.trim().replaceAll("。", "。\n");
        return a;
      });
      return ctx.render(apps);
    } finally {
      conn.release();
    }
  }
}

export default function({ data }: PageProps<App[]>) {
  return (
    <>
      <a href="/post" class="block text-blue-700 text-center text-2xl">投稿する</a>
      {data.map((app) => <AppDiv app={app}/>)}
    </>
  );
}
