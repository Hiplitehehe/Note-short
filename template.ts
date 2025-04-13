
export async function getFormData(req: Request) {
  const form = await req.formData();
  return {
    note: form.get("note")?.toString(),
    tags: form.get("tags")?.toString()?.split(",").map(t => t.trim()) || [],
    user: form.get("user")?.toString(),
    pass: form.get("pass")?.toString(),
    token: form.get("g-recaptcha-response")?.toString()
  };
}

export function renderHTML({ notes, user, siteKey }: { notes: any[], user: string, siteKey: string }) {
  const list = notes.map(n => {
    const text = n?.text || "undefined";
    const tags = Array.isArray(n?.tags) ? n.tags.join(", ") : "";
    return `<li>${text} (${tags})</li>`;
  }).join("");

  return new Response(`<!DOCTYPE html>
<html>
<head>
  <title>Notes</title>
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
</head>
<body>
  <h2>Welcome, ${user} | <a href="/logout">Logout</a></h2>
  <form method="POST" action="/add">
    <input name="note" placeholder="Note" required>
    <input name="tags" placeholder="tags (comma)">
    <button class="g-recaptcha" data-sitekey="${siteKey}" data-callback="onSubmit">Add Note</button>
  </form>
  <ul>${list}</ul>
  <script>
    function onSubmit(token) {
      document.forms[0].submit();
    }
  </script>
</body>
</html>`, {
    headers: { "Content-Type": "text/html" }
  });
}

export function renderLogin(siteKey: string) {
  return new Response(`<!DOCTYPE html>
<html>
<head>
  <title>Login</title>
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
</head>
<body>
  <h2>Login</h2>
  <form method="POST" action="/login">
    <input name="user" placeholder="Username" required>
    <input name="pass" type="password" placeholder="Password" required>
    <button class="g-recaptcha" data-sitekey="${siteKey}" data-callback="onSubmit">Login</button>
  </form>
  <a href="/signup">Signup</a>
  <script>
    function onSubmit(token) {
      document.forms[0].submit();
    }
  </script>
</body>
</html>`);
}

export function renderSignup(siteKey: string) {
  return new Response(`<!DOCTYPE html>
<html>
<head>
  <title>Signup</title>
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
</head>
<body>
  <h2>Signup</h2>
  <form method="POST" action="/signup">
    <input name="user" placeholder="Username" required>
    <input name="pass" type="password" placeholder="Password" required>
    <button class="g-recaptcha" data-sitekey="${siteKey}" data-callback="onSubmit">Signup</button>
  </form>
  <a href="/login">Login</a>
  <script>
    function onSubmit(token) {
      document.forms[0].submit();
    }
  </script>
</body>
</html>`);
}
