import { readdir } from "node:fs/promises";
import path from "node:path";

// Lists public/music/soundN.* in number order. Static: built at deploy time; dev reads the folder on each request.
export const dynamic = "force-static";

const pattern = /^sound(\d+)\.(mp3|m4a|aac|ogg|opus|wav|flac)$/i;

export async function GET() {
  let files: string[] = [];
  try { files = await readdir(path.join(process.cwd(), "public", "music")); } catch { /* no folder yet */ }
  const tracks = files
    .map(name => ({ name, match: name.match(pattern) }))
    .filter((f): f is { name: string; match: RegExpMatchArray } => Boolean(f.match))
    .sort((a, b) => Number(a.match[1]) - Number(b.match[1]))
    .map(({ name, match }) => ({ title: `Sound ${match[1]}`, src: `/music/${encodeURIComponent(name)}` }));
  return Response.json({ tracks });
}
