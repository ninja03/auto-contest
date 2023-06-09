import { HandlerContext, Handlers } from "$fresh/server.ts";
import { insert } from "@/db.ts";
import { talk } from "@/chatgpt.ts";

export const handler: Handlers = {
  async POST(req: Request, ctx: HandlerContext) {
    const form = await req.formData();
    const title = form.get("title") as string;
    const description = form.get("description") as string;
    const author = form.get("author") as string;

    const prompt = `
    アプリ名: ${title}
    説明:
    ${description}
    作者: ${author}
  
    このアプリの感想を述べてください。
    `;
    const comment = await talk(prompt);

    await insert({ title, description, author, comment });
    const { origin } = new URL(req.url);
    return Response.redirect(origin);
  },
};

export default function Post() {
  return (
    <>
      <form
        method="post"
        action="/post"
        class="shadow-md text-center bg-white max-w-3xl mx-auto"
      >
        <div class="p-2">
          <div class="text-xl mb-2">アプリ名</div>
          <input
            name="title"
            value="やば道チェッカー"
            class="rounded p-2 border border-black"
          />
        </div>

        <div class="p-2">
          <div class="text-xl mb-2">説明</div>
          <textarea
            rows={15}
            cols={70}
            name="description"
            class="rounded p-2 border border-black"
          >
            {`目的
地域（国高地区）の人に対して危ない場所はどこか分かるように視覚化するアプリ

機能
・危険度ランキング
・検索した経路の危険な場所
・危険な場所をとタップすると、人目線、車目線を体感できる
・危ないと体験した場所に投稿可能
・危険な場所の改善案の提案
・いいね機能`}
          </textarea>
        </div>

        <div class="p-2">
          <div class="text-xl mb-2">作者</div>
          <input
            name="author"
            value="ninja03"
            class="rounded p-2 border border-black"
          />
        </div>

        <div class="p-2 mt-4">
          <input
            type="submit"
            value="投稿"
            class="rounded p-2 bg-white w-24 border border-black"
          />
        </div>
      </form>
    </>
  );
}
