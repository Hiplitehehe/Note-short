
export async function getFormData(req: Request) {
  const form = await req.formData();
  return {
    note: form.get("note")?.toString(),
    tags: form.get("tags")?.toString()?.split(",").map(t => t.trim()) || [],
    user: form.get("user")?.toString() || "guest",
    token: form.get("g-recaptcha-response")?.toString(),
    id: form.get("id")?.toString(),
  };
}

export function renderHTML({ notes, siteKey }: { notes: any[], siteKey: string }) {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <title>Notes</title>
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
</head>
<body>
  <form method="POST" action="/add">
    <input name="note" required>
    <input name="tags" placeholder="tags (comma)">
    <input name="user" value="guest" hidden>
    <button class="g-recaptcha" 
            data-sitekey="${siteKey}" 
            data-callback="onSubmit">Add Note</button>
  </form>
  <ul>
    ${notes.map(n => `<li>${n.text} (${n.tags.join(", ")}) - тнР ${n.stars}</li>`).join("")}
  </ul>
  <form method="POST" action="/react">
    <input name="id" placeholder="Note ID">
    <button class="g-recaptcha" 
            data-sitekey="${siteKey}" 
            data-callback="onSubmit">React</button>
  </form>
  <script>
    function onSubmit(token) {
      document.querySelector("form").submit();
    }
  </script>
</body>
</html>`, {
    headers: { "Content-Type": "text/html" }
  });
}
