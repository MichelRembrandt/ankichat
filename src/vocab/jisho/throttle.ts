// ---------- Rate limiting (be a polite unofficial-API citizen) ----------

const MIN_INTERVAL_MS = 200;

let lastCallAt = 0;

export async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastCallAt;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  lastCallAt = Date.now();
}
