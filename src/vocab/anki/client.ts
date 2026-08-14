/**
 * client.ts
 *
 * Thin typed request client for the AnkiConnect (or AnkiConnect Plus) local HTTP API.
 * Anki must be running with the AnkiConnect add-on installed
 * (add-on code: 2055492159) for any of these calls to succeed.
 *
 * Docs: https://foosoft.net/projects/anki-connect/
 */

const ANKI_CONNECT_URL = "http://127.0.0.1:8765";
const ANKI_CONNECT_VERSION = 6;

interface AnkiConnectResponse<T> {
  result: T;
  error: string | null;
}

export async function invoke<T = unknown>(
  action: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  let res: Response;

  try {
    res = await fetch(ANKI_CONNECT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, version: ANKI_CONNECT_VERSION, params }),
    });
  } catch (err) {
    throw new Error(
      `Could not reach AnkiConnect at ${ANKI_CONNECT_URL}. ` +
        `Is Anki running with the AnkiConnect add-on installed? (${(err as Error).message})`
    );
  }

  const data = (await res.json()) as AnkiConnectResponse<T>;

  if (data.error) {
    throw new Error(`AnkiConnect error on "${action}": ${data.error}`);
  }

  return data.result;
}
