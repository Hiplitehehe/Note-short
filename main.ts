
import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { renderPage } from "./template.ts";

const kv = await Deno.openKv();
const router = new Router();

router
  .get("/", async (ctx) => {
    const notes = [];
    for await (const entry of kv.list({ prefix: ["note"] })) {
      notes.push({ id: entry.key[1], content: entry.value });
    }

    ctx.response.headers.set("Content-Type", "text/html");
    ctx.response.body = renderPage(notes);
  })

  .post("/add", async (ctx) => {
    const body = await ctx.request.body({ type: "form" }).value;
    const note = body.get("note");
    const id = crypto.randomUUID();
    await kv.set(["note", id], note);
    ctx.response.redirect("/");
  })

  .post("/delete", async (ctx) => {
    const body = await ctx.request.body({ type: "form" }).value;
    const id = body.get("id");
    await kv.delete(["note", id]);
    ctx.response.redirect("/");
  });

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

console.log("Listening on http://localhost:8000");
await app.listen({ port: 8000 });
