
export async function verifyCaptcha(token: string, secret: string): Promise<boolean> {
  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${secret}&response=${token}`
  });
  const data = await res.json();
  return data.success === true;
}
