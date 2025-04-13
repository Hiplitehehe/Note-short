
const kv = await Deno.openKv();

export async function createUser(username: string, password: string) {
  const exists = await kv.get(["user", username]);
  if (exists.value) return false;
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  await kv.set(["user", username], Array.from(new Uint8Array(hash)));
  return true;
}

export async function getUser(username: string, password: string) {
  const data = await kv.get(["user", username]);
  if (!data.value) return false;
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  const current = Array.from(new Uint8Array(hash));
  return JSON.stringify(current) === JSON.stringify(data.value);
}

export async function createSession(username: string) {
  const sid = crypto.randomUUID();
  await kv.set(["session", sid], username);
  return sid;
}

export async function verifySession(sid: string) {
  const data = await kv.get(["session", sid]);
  return data.value?.toString();
}

export async function clearSession(sid: string) {
  await kv.delete(["session", sid]);
}

export async function storeNote(username: string, text: string, tags: string[]) {
  const id = crypto.randomUUID();
  await kv.set(["note", username, id], { text, tags });
}

export async function getUserNotes(username: string) {
  const iter = kv.list({ prefix: ["note", username] });
  const notes = [];
  for await (const entry of iter) notes.push(entry.value);
  return notes;
}
