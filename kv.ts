

const kv = await Deno.openKv();

export async function kvSaveNote({ note, tags, user }) {
  const id = crypto.randomUUID();
  await kv.set(["note", id], {
    id, text: note, tags, stars: 0, user, time: Date.now()
  });
}

export async function kvGetNotes() {
  const notes = [];
  for await (const entry of kv.list({ prefix: ["note"] })) {
    notes.push(entry.value);
  }
  return notes.sort((a, b) => b.time - a.time);
}

export async function kvAddReaction(id: string) {
  const entry = await kv.get(["note", id]);
  if (!entry.value) return;
  entry.value.stars += 1;
  await kv.set(["note", id], entry.value);
}
