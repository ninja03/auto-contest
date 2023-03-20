import { pool } from "../db.js";
import { App } from "../components.jsx";

export const handler = {
  async GET(req, ctx) {
    const conn = await pool.connect();
    try {
      const result = await conn.queryObject("SELECT * FROM contest ORDER BY id DESC");
      const apps = result.rows.map((a) => {
        a.comment = a.comment.trim().replaceAll("。", "。\n");
        return a;
      });
      return ctx.render({ apps });
    } finally {
      conn.release();
    }
  }
}

export default function({ data }) {
  const { apps } = data;
  return (
    <>
      <a href="/post" class="block text-blue-700 text-center text-2xl">投稿する</a>
      {apps.map((app) => <App app={app}/>)}
    </>
  );
}
