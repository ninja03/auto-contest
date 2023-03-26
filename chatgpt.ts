export async function talk(prompt: string) {
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
