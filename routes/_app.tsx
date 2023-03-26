import { AppProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function (props: AppProps) {
  return (
    <>
      <Head>
        <title>アプリコンテスト練習場</title>
      </Head>
      <div class="px-8 bg-gray-200">
        <header class="p-4 text-center text-4xl">
          アプリコンテスト練習場
        </header>
        <props.Component />
      </div>
      <footer class="h-16 bg-gray-200"></footer>
    </>
  );
}
