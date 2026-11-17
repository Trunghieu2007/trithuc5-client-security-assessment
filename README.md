# TRITHUC5.0 V4.3.9 — client-side security assessment

Public, read-only assessment of `https://trithuc500.vercel.app/`. Scope was limited to
client-side mechanisms. No server was modified, no account was created, nothing was written
to the public ntfy topics or the Cloud KV app, and no packet was sent to other users.

## Result

All six reviewed protection layers are client-side and can be bypassed from the browser:

| Severity | Surface |
|---|---|
| CAO (high) | Cloud sync: public ntfy/KV, hard-coded signing secret, tombstone merge without signature check |
| CAO (high) | Admin auth: base64 credentials and hard-coded session salt in the shipped HTML |
| CAO (high) | Exam answers: `correctAnswers` shipped in plaintext, XOR obfuscation with public key material |
| CAO (high) | Data integrity: VIP and device flags signed by a hard-coded salt and recomputed by the client |
| TB (medium) | Device/Gmail lock: device ID and trusted list live in writable localStorage |
| THẤP (low) | Anti-cheat: `preventDefault`, DOM watermark and CSS blur only |

Full findings, exact source line numbers, step-by-step PoCs, real-world impact and concrete
patches are in [`research/trithuc5/REPORT.md`](research/trithuc5/REPORT.md).

## Repository contents

- `research/trithuc5/REPORT.md` — full Vietnamese assessment and severity table.
- `research/trithuc5/index.html` — exact public HTML copy used for line numbers, 14,226,000 bytes.
- `research/trithuc5/root.headers` — HTTP response headers captured with the copy.
- `research/trithuc5/poc/poc_client.js` — executable PoC that extracts and runs the real functions from the HTML.
- `research/trithuc5/poc/last_run.log` — captured stdout of the final passing run.
- `HANDOFF.md` — session handoff with measured facts, assumptions, stop condition and next step.

## Reproduce

The PoC needs only Node.js 22 or newer. It reads the local HTML copy, extracts the target's
real functions by name, asserts their identities, and executes them locally. It performs no
network writes.

```bash
node research/trithuc5/poc/poc_client.js
```

Expected final lines:

```
  [ok] ntfy POST carries no auth header (line 3313)

POC RESULT: all checks executed locally; no writes to ntfy/KV, no account created.
```

Exit code: `0`.

The HTML copy is identified by SHA-256:
`fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5`.
All line numbers in the report refer to this exact file. If the target is redeployed, re-measure
before relying on any line reference.

## Boundaries observed

- No brute-force, no DoS, no server modification.
- No real account created and no third-party account accessed.
- No write to public ntfy topics or the Cloud KV app.
- A live packet test would affect other users' client state; it was identified as a stop
  condition and deliberately not executed.
- A read-only ntfy request timed out and a KV read returned HTTP 503 during the session, so
  no live packet content is included here.

## Fix priority

1. Move entitlement and admin decisions to a server that owns the secrets.
2. Remove plaintext `correctAnswers` from client payloads and rotate the exposed secrets.
3. Authenticate and sign every cloud packet before any state mutation, including tombstones.
4. Treat device/Gmail binding and anti-cheat as UX only until enforced server-side.
