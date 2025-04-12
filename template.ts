export function renderPage(notes: { id: string; content: string }[]) {
  let notesHtml = notes.map(note => {
    return `
      <li>
        ${note.content}
        <form method="POST" action="/delete" style="display:inline;">
          <input type="hidden" name="id" value="${note.id}">
          <button type="submit">Delete</button>
        </form>
      </li>
    `;
  }).join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Deno Notes</title>
    </head>
    <body>
      <h1>Deno Notes</h1>
      <form method="POST" action="/add">
        <input name="note" placeholder="Write a note" required>
        <button type="submit">Add</button>
      </form>
      <ul>
        ${notesHtml}
      </ul>
    </body>
    </html>
  `;
}
