
import { serve } from "https://deno.land/std/http/server.ts";
import { getFormData, renderHTML } from "./template.ts";
import { verifyCaptcha } from "./captcha.ts";
import { kvGetUser, kvSaveNote, kvGetNotes, kvAddReaction } from "./kv.ts";

const CAPTCHA_PROVIDER = "recaptcha_v2_invisible";
const SITE_KEY = "6LfoZxYrAAAAABpgDrDQ-XBW6BXoSqF9AcjjuJgD";
const SECRET_KEY = "6LfoZxYrAAAAAO3oa1stPuQdOWBgZHowhoA59FtH";

serve(async (req) => {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const method = req.method;

  if (pathname === "/" && method === "GET") {
    const notes = await kvGetNotes();
    return renderHTML({ notes, siteKey: SITE_KEY });
  }

  if (pathname === "/add" && method === "POST") {
    const { note, tags, token, user } = await getFormData(req);
    const valid = await verifyCaptcha(token, SECRET_KEY, CAPTCHA_PROVIDER);
    if (!valid) return new Response("CAPTCHA failed", { status: 403 });

    await kvSaveNote({ note, tags, user });
    return Response.redirect("/", 303);
  }

  if (pathname === "/react" && method === "POST") {
    const { id, token } = await getFormData(req);
    const valid = await verifyCaptcha(token, SECRET_KEY, CAPTCHA_PROVIDER);
    if (!valid) return new Response("CAPTCHA failed", { status: 403 });

    await kvAddReaction(id);
    return Response.redirect("/", 303);
  }

  return new Response("404 Not Found", { status: 404 });
});
