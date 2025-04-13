import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getCookies, setCookie, deleteCookie } from "https://deno.land/std@0.224.0/http/cookie.ts";

const kv = await Deno.openKv();
const SITE_KEY = "6LfoZxYrAAAAABpgDrDQ-XBW6BXoSqF9AcjjuJgD";
const SECRET_KEY = "6LfoZxYrAAAAAO3oa1stPuQdOWBgZHowhoA59FtH";

function renderHTML(notes: any[], user: string) {
  return new Response(\`<!DOCTYPE html>
<html>
<head><title>Notes</title><script src="https://www.google.com/recaptcha/api.js" async defer></script></head>
<body>
<h2>Welcome, \${user} | <a href="/logout">Logout</a></h2>
<form method="POST" action="/add">
  <input name="note" placeholder="Note" required>
  <input name="tags" placeholder="tags (comma)">
  <button class="g-recaptcha" data-sitekey="\${SITE_KEY}" data-callback="onSubmit">Add Note</button>
</form>
<ul>
  \${notes.map(n => {
    const text = n?.text ?? "undefined";
    const tags = Array.isArray(n?.tags) ? n.tags.join(", ") : "";
    return \`<li>\${text} (\${tags})</li>\`;
  }).join("")}
</ul>
<script>
function onSubmit(token) {
  document.forms[0].submit();
}
</script>
</body></html>\`, { headers: { "Content-Type": "text/html" } });
}

function renderLogin() {
  return new Response(\`<!DOCTYPE html>
<html><head><title>Login</title><script src="https://www.google.com/recaptcha/api.js" async defer></script></head>
<body><h2>Login</h2>
<form method="POST" action="/login">
  <input name="user" placeholder="Username" required>
  <input name="pass" type="password" placeholder="Password" required>
  <button class="g-recaptcha" data-sitekey="\${SITE_KEY}" data-callback="onSubmit">Login</button>
</form>
<a href="/signup">Signup</a>
<script>function onSubmit(token){document.forms[0].submit();}</script>
</body></html>\`, { headers: { "Content-Type": "text/html" } });
}

function renderSignup() {
  return new Response(\`<!DOCTYPE html>
<html><head><title>Signup</title><script src="https://www.google.com/recaptcha/api.js" async defer></script></head>
<body><h2>Signup</h2>
<form method="POST" action="/signup">
  <input name="user" placeholder="Username" required>
  <input name="pass" type="password" placeholder="Password" required>
  <button class="g-recaptcha" data-sitekey="\${SITE_KEY}" data-callback="onSubmit">Signup</button>
</form>
<a href="/login">Login</a>
<script>function onSubmit(token){document.forms[0].submit();}</script>
</body></html>\`, { headers: { "Content-Type": "text/html" } });
}

async function verifyCaptcha(token: string) {
  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret: SECRET_KEY, response: token }),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  const json = await res.json();
  return json.success;
}

function getHash(str: string) {
  return Array.from(new TextEncoder().encode(str)).reduce((a, b) => a + b.toString(16), "");
}

function redirect(path: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: path }
  });
}

serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const cookies = getCookies(req.headers);
  const session = cookies.session;
  const user = session ? (await kv.get(["session", session])).value as string : null;

  if (path === "/") {
    if (!user) return redirect("/login");
    const notes = (await kv.list({ prefix: ["notes", user] })).map((entry) => entry.value);
    return renderHTML(notes, user);
  }

  if (path === "/login" && req.method === "GET") return renderLogin();
  if (path === "/signup" && req.method === "GET") return renderSignup();

  if (path === "/signup" && req.method === "POST") {
    const form = await req.formData();
    const username = form.get("user")?.toString() || "";
    const pass = form.get("pass")?.toString() || "";
    const token = form.get("g-recaptcha-response")?.toString() || "";
    if (!(await verifyCaptcha(token))) return new Response("CAPTCHA failed", { status: 400 });
    const hash = getHash(pass);
    await kv.set(["users", username], { hash });
    const sessionId = crypto.randomUUID();
    await kv.set(["session", sessionId], username);
    const res = redirect("/");
    setCookie(res.headers, { name: "session", value: sessionId, path: "/" });
    return res;
  }

  if (path === "/login" && req.method === "POST") {
    const form = await req.formData();
    const username = form.get("user")?.toString() || "";
    const pass = form.get("pass")?.toString() || "";
    const token = form.get("g-recaptcha-response")?.toString() || "";
    if (!(await verifyCaptcha(token))) return new Response("CAPTCHA failed", { status: 400 });
    const userRecord = await kv.get(["users", username]);
    if (!userRecord.value || userRecord.value.hash !== getHash(pass)) {
      return new Response("Invalid login", { status: 401 });
    }
    const sessionId = crypto.randomUUID();
    await kv.set(["session", sessionId], username);
    const res = redirect("/");
    setCookie(res.headers, { name: "session", value: sessionId, path: "/" });
    return res;
  }

  if (path === "/add" && req.method === "POST") {
    if (!user) return redirect("/login");
    const form = await req.formData();
    const note = form.get("note")?.toString() || "";
    const tags = form.get("tags")?.toString()?.split(",").map(t => t.trim()) || [];
    const token = form.get("g-recaptcha-response")?.toString() || "";
    if (!(await verifyCaptcha(token))) return new Response("CAPTCHA failed", { status: 400 });
    await kv.set(["notes", user, crypto.randomUUID()], { text: note, tags });
    return redirect("/");
  }

  if (path === "/logout") {
    const res = redirect("/login");
    deleteCookie(res.headers, "session", { path: "/" });
    return res;
  }

  return new Response("Not found", { status: 404 });
});
