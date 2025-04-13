

import { renderHTML, renderLogin, renderSignup } from "./template.ts";
import { verifyCaptcha } from "./captcha.ts";
import { getFormData } from "./template.ts";
import { createUser, getUser, storeNote, getUserNotes, verifySession, createSession, clearSession } from "./kv.ts";

const SITE_KEY = "6LfoZxYrAAAAABpgDrDQ-XBW6BXoSqF9AcjjuJgD";
const SECRET_KEY = "6LfoZxYrAAAAAO3oa1stPuQdOWBgZHowhoA59FtH";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;
  const cookies = Object.fromEntries(req.headers.get("cookie")?.split("; ").map(c => c.split("=")) || []);
  const sessionId = cookies.session || "";
  const currentUser = await verifySession(sessionId);

  if (path === "/" && method === "GET") {
    if (!currentUser) return renderLogin(SITE_KEY);
    const notes = await getUserNotes(currentUser);
    return renderHTML({ notes, user: currentUser, siteKey: SITE_KEY });
  }

  if (path === "/signup" && method === "GET") return renderSignup(SITE_KEY);
  if (path === "/login" && method === "GET") return renderLogin(SITE_KEY);

  if (path === "/signup" && method === "POST") {
    const { user, pass, token } = await getFormData(req);
    const valid = await verifyCaptcha(token, SECRET_KEY);
    if (!valid) return new Response("CAPTCHA failed", { status: 403 });
    const created = await createUser(user, pass);
    if (!created) return new Response("User exists", { status: 409 });
    const sid = await createSession(user);
    return new Response(null, {
      status: 303,
      headers: { "Set-Cookie": `session=${sid}; Path=/`, "Location": "/" }
    });
  }

  if (path === "/login" && method === "POST") {
    const { user, pass, token } = await getFormData(req);
    const valid = await verifyCaptcha(token, SECRET_KEY);
    if (!valid) return new Response("CAPTCHA failed", { status: 403 });
    const validUser = await getUser(user, pass);
    if (!validUser) return new Response("Invalid login", { status: 401 });
    const sid = await createSession(user);
    return new Response(null, {
      status: 303,
      headers: { "Set-Cookie": `session=${sid}; Path=/`, "Location": "/" }
    });
  }

  if (path === "/logout") {
    await clearSession(sessionId);
    return new Response(null, {
      status: 303,
      headers: { "Set-Cookie": "session=; Path=/; Max-Age=0", "Location": "/" }
    });
  }

  if (path === "/add" && method === "POST") {
    if (!currentUser) return new Response("Login required", { status: 403 });
    const { note, tags, token } = await getFormData(req);
    const valid = await verifyCaptcha(token, SECRET_KEY);
    if (!valid) return new Response("CAPTCHA failed", { status: 403 });
    await storeNote(currentUser, note, tags);
    return Response.redirect(new URL("/", req.url), 303);
  }

  return new Response("Not found", { status: 404 });
});
