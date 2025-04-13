import { serve } from "https://deno.land/std/http/server.ts";

function htmlEscape(str = "") {
  return str.replace(/[&<>"']/g, s => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
  }[s] || s));
}

let notes: { text: string; user: string }[] = [];

serve(async (req) => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (pathname === "/" && req.method === "GET") {
    return new Response(`<!DOCTYPE html>
<html>
<head><title>Notes</title></head>
<body>
<h1>Notes</h1>
<form method="POST" action="/add">
  <input name="note" placeholder="Write a note" required>
  <input name="user" placeholder="User" required>
  <button type="submit">Add</button>
</form>
<ul>
  ${notes.map(n => `<li>${htmlEscape(n.text)} (${htmlEscape(n.user)})</li>`).join("")}
</ul>
</body>
</html>`, { headers: { "Content-Type": "text/html" } });
  }

  if (pathname === "/add" && req.method === "POST") {
    const form = await req.formData();
    const note = form.get("note")?.toString() || "";
    const user = form.get("user")?.toString() || "anonymous";

    if (note) notes.push({ text: note, user });
    return Response.redirect("/", 302);
  }

  return new Response("Not Found", { status: 404 });
});

