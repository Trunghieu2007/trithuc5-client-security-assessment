# Source artifact policy

The full verbatim public HTML is **not committed** to this repository because the target
publishes credential and signing literals inside it. Committing a copy would republish those
values. The reports therefore refer to source locations, and all credential values in reports,
logs and test fixtures are redacted.

To reproduce the analysis, fetch the public page yourself and verify its hash:

```bash
mkdir -p research/trithuc5/phase5
curl -sS -H 'Cache-Control: no-cache' \
  -o research/trithuc5/phase5/target.html \
  'https://trithuc500.vercel.app/?cb=audit'
sha256sum research/trithuc5/phase5/target.html
```

Expected SHA-256 for the current V4.8.6 build (fetched 2026-11-22T10:36:26Z):

```
ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185
```

Measured size: 9,120,257 bytes / 34,677 lines. Previous pins:

| Build | SHA-256 (prefix) | Notes |
|---|---|---|
| V4.8.6 (current) | `ffe94aea…` | Server admin login, `/api/results`, KV disabled, admin/vault hash literals removed |
| V4.8.0 | `be27a5bc…` | Client-side admin session, public KV path still present |
| V4.6.7 | `8ec45ea6…` | Intermediate live check |
| V4.5 / V4.6.3 | `eff11902…` | Hash-literal vault, gzip/XOR exam store |
| V4.4 | `33be09d7…` | Original VIP seal chain analysis |

The test harnesses refuse to run if the measured hash differs. Pass the fetched file
explicitly: `export TRITHUC_SOURCE=/absolute/path/to/phase5/target.html`. If the site is
redeployed, re-measure line numbers and update `EXPECTED_SHA` in `harness.js`,
`phase4_harness.js` and `independent_verification.js` only after confirming the change is
intentional.

V4.8.6 line pins used by harnesses:

- hash functions and emptied literals: 2030–2055
- closure-vault variables: 1993–2005
- sensitive-storage regex: 2228
- boot normalizer: 3575–3643
- remembered admin session restore: 3740–3752
- public cloud constants: 4295–4299
- cloud nonce registry: 5768
- server admin login: 31907–31959
- results API: 4692–4698 (POST), 4814–4819 (GET)

`evidence/source-refs.txt` lists the complete measured line map.
`evidence/test-results.txt` records the final run against the hash above.
