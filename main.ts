
// deno-notes-auth/main.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { getCookies, setCookie, deleteCookie } from "https://deno.land/std/http/cookie.ts";

const kv = await Deno.openKv();

serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;
  const cookies = getCookies(req.headers);
  const username = cookies.session;

  if (!username && path !== "/login") {
    return redirect("/login");
  }

  if (method === "GET" && path === "/login") {
    return html(`
      <h2>Login / Signup</h2>
      <form method="POST" action="/login">
        <input name="username" placeholder="Username" required />
        <input name="password" placeholder="Password" type="password" required />
        <button type="submit">Enter</button>
      </form>
    `);
  }

  if (method === "POST" && path === "/login") {
    const form = await req.formData();
    const username = form.get("username")?.toString() ?? "";
    const password = form.get("password")?.toString() ?? "";
    const stored = await kv.get(["user", username]);

    if (!stored.value) {
      await kv.set(["user", username], password);
    } else if (stored.value !== password) {
      return html("<p>Invalid password. <a href='/login'>Try again</a></p>");
    }

    const headers = new Headers();
    setCookie(headers, { name: "session", value: username, path: "/" });
    headers.set("Location", "/");
    return new Response(null, { status: 303, headers });
  }

  if (method === "GET" && path === "/logout") {
    const headers = new Headers();
    deleteCookie(headers, "session");
    headers.set("Location", "/login");
    return new Response(null, { status: 303, headers });
  }

  if (method === "GET" && path === "/") {
    const notes = [];
    for await (const entry of kv.list({ prefix: ["note", username] })) {
      notes.push({ id: entry.key[2], content: entry.value });
    }
    return html(renderPage(username, notes));
  }

  if (method === "POST" && path === "/add") {
    const form = await req.formData();
    const note = form.get("note")?.toString();
    if (note) {
      const id = crypto.randomUUID();
      await kv.set(["note", username, id], note);
    }
    return redirect("/");
  }

  if (method === "POST" && path === "/delete") {
    const form = await req.formData();
    const id = form.get("id")?.toString();
    if (id) await kv.delete(["note", username, id]);
    return redirect("/");
  }

  if (method === "POST" && path === "/edit") {
    const form = await req.formData();
    const id = form.get("id")?.toString();
    const content = form.get("content")?.toString();
    if (id && content) await kv.set(["note", username, id], content);
    return redirect("/");
  }

  if (method === "GET" && path === "/export") {
    const notes = [];
    for await (const entry of kv.list({ prefix: ["note", username] })) {
      notes.push({ id: entry.key[2], content: entry.value });
    }
    const body = JSON.stringify(notes, null, 2);
    return new Response(body, {
      headers: { "content-type": "application/json" },
    });
  }

  return new Response("404 Not Found", { status: 404 });
});

function html(body: string) {
  return new Response(`<!DOCTYPE html><html><body>${body}</body></html>`, {
    headers: { "content-type": "text/html" },
  });
}

function redirect(location: string) {
  return new Response(null, {
    status: 303,
    headers: { Location: location },
  });
}

function renderPage(username: string, notes: { id: string; content: string }[]) {
  const list = notes
    .map(
      (n) => `
      <li>
        <form method="POST" action="/edit">
          <input type="hidden" name="id" value="${n.id}" />
          <input name="content" value="${n.content}" />
          <button type="submit">Save</button>
        </form>
        <form method="POST" action="/delete" style="display:inline">
          <input type="hidden" name="id" value="${n.id}" />
          <button type="submit">Delete</button>
        </form>
      </li>`
    )
    .join("");

  return `
    <h1>${username}'s Notes</h1>
    <form method="POST" action="/add">
      <input name="note" placeholder="Write a note" required />
      <button type="submit">Add</button>
    </form>
    <ul>${list}</ul>
    <p>
      <a href="/export">Export Notes</a> |
      <a href="/logout">Logout</a>
    </p>
  `;
}
