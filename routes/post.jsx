import { pool } from "../db.js";
import { talk } from "../chatgpt.js";

export const handler = {
  async POST(req, ctx) {
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
      await conn.queryObject(
        "INSERT INTO contest (title, description, author, comment) VALUES ($1, $2, $3, $4)",
        [title, description, author, comment]
      );
    } finally {
      conn.release();
    }
    const { origin } = new URL(req.url);
    return Response.redirect(origin);
  }
}

export default function() {
  return (
    <>
      <form method="post" action="/post" class="shadow-md text-center bg-white max-w-3xl mx-auto">

      <div class="p-2">
        <div class="text-xl mb-2">アプリ名</div>
        <input name="title" value="やば道チェッカー" class="rounded p-2 border border-black"/>
      </div>

      <div class="p-2">
        <div class="text-xl mb-2">説明</div>
        <textarea rows={15} cols={70} name="description" class="rounded p-2 border border-black">{`目的
地域（国高地区）の人に対して危ない場所はどこか分かるように視覚化するアプリ

機能
・危険度ランキング
・検索した経路の危険な場所
・危険な場所をとタップすると、人目線、車目線を体感できる
・危ないと体験した場所に投稿可能
・危険な場所の改善案の提案
・いいね機能`}</textarea>
      </div>

      <div class="p-2">
        <div class="text-xl mb-2">作者</div>
        <input name="author" value="ninja03" class="rounded p-2 border border-black"/>
      </div>

      <div class="p-2 mt-4">
        <input type="submit" value="投稿" class="rounded p-2 bg-white w-24 border border-black"/>
      </div>
      </form>
    </>
  );
}
