// Kryptografisches Pseudonymisieren von IP/E-Mail (DSGVO).
//
// Ersetzt das frühere djb2 (nicht-kryptografisch, 32 Bit, umkehrbar) durch
// HMAC-SHA-256 mit einem geheimen Pepper aus der Umgebung. Der Pepper darf
// NICHT im Repo stehen; er wird im Convex Dashboard unter Environment
// Variables als ANALYTICS_HASH_PEPPER gesetzt.
//
// Convex stellt die Web-Crypto-API (crypto.subtle) auch in Query/Mutation
// zur Verfügung, daher sind diese Funktionen async.

function getPepper(): string {
  const pepper = process.env.ANALYTICS_HASH_PEPPER;
  if (!pepper) {
    // Fail-closed: ohne Pepper wäre der HMAC mit einer öffentlichen
    // Konstante gebildet und die Pseudonymisierung wertlos (DSGVO,
    // Kinder-Daten). Pepper ist auf dev UND prod gesetzt; fehlt er,
    // soll Tracking ausfallen statt schwach zu hashen.
    throw new Error("ANALYTICS_HASH_PEPPER ist nicht gesetzt (Convex Environment Variables)");
  }
  return pepper;
}

async function hmacHex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getPepper()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(input));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashIp(ip: string | undefined): Promise<string | undefined> {
  if (!ip) return undefined;
  return await hmacHex("ip:" + ip);
}

export async function hashEmail(email: string): Promise<string> {
  return await hmacHex("email:" + email.toLowerCase().trim());
}
