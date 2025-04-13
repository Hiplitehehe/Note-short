
import { serve } from "https://deno.land/std/http/server.ts";

const kv = await Deno.openKv();

serve(async (req) => {
  const { pathname } = new URL(req.url);

  if (req.method === "GET" && pathname === "/") {
    const notes = [];
    for await (const entry of kv.list({ prefix: ["note"] })) {
      notes.push({ id: entry.key[1], content: entry.value });
    }

    return new Response(renderPage(notes), {
      headers: { "content-type": "text/html" },
    });
  }

  if (req.method === "POST" && pathname === "/add") {
    const formData = await req.formData();
    const note = formData.get("note");
    if (note) {
      const id = crypto.randomUUID();
      await kv.set(["note", id], note);
    }
    return redirect("/");
  }

  if (req.method === "POST" && pathname === "/delete") {
    const formData = await req.formData();
    const id = formData.get("id");
    if (id) {
      await kv.delete(["note", id]);
    }
    return redirect("/");
  }

  return new Response("404 Not Found", { status: 404 });
});

function redirect(location: string) {
  return new Response(null, {
    status: 303,
    headers: { Location: location },
  });
}

function renderPage(notes: { id: string; content: string }[]) {
  const notesHtml = notes
    .map(
      (note) => `
      <li>
        ${note.content}
        <form method="POST" action="/delete" style="display:inline;">
          <input type="hidden" name="id" value="${note.id}">
          <button type="submit">Delete</button>
        </form>
      </li>`
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Deno Notes</title>
    </head>
    <body>
      <h1>Deno Notes</h1>
      <form method="POST" action="/add">
        <input name="note" placeholder="Write a note" required />
        <button type="submit">Add</button>
      </form>
      <ul>${notesHtml}</ul>
    </body>
    </html>
  `;
}
