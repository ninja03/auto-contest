import { createClient } from "https://esm.sh/@supabase/supabase-js@2.11.0";
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface App {
  id: number;
  title: string;
  description: string;
  author: string;
  comment: string;
}

export async function findAll() {
  const result = await supabase
    .from("contest")
    .select()
    .order("id", { ascending: false });
  return result.data as App[];
}

export async function insert(data: {
  title: string;
  description: string;
  author: string;
  comment: string;
}) {
  await supabase.from("contest").insert({
    title: data.title,
    descripion: data.description,
    author: data.author,
    comment: data.comment,
  });
}
