import { findAll } from "@/db.ts";
import { AppDiv } from "@/components.tsx";
import { HandlerContext, Handlers, PageProps } from "$fresh/server.ts";
import { App } from "@/db.ts";

export const handler: Handlers<App[]> = {
  async GET(req: Request, ctx: HandlerContext<App[]>) {
    const result = await findAll();
    const apps = (result as App[]).map((a) => {
      a.comment = a.comment.trim().replaceAll("。", "。\n");
      return a;
    });
    return ctx.render(apps);
  },
};

export default function (props: PageProps<App[]>) {
  return (
    <>
      <a href="/post" class="block text-blue-700 text-center text-2xl">
        投稿する
      </a>
      {props.data.map((app) => <AppDiv app={app} />)}
    </>
  );
}
