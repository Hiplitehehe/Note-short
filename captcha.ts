

export async function verifyCaptcha(token: string, secret: string, provider = "recaptcha_v2_invisible") {
  if (!token) return false;

  let verifyURL = "https://www.google.com/recaptcha/api/siteverify";
  const params = new URLSearchParams({ secret, response: token });

  const res = await fetch(verifyURL, {
    method: "POST",
    body: params,
  });

  const json = await res.json();
  return json.success;
}
