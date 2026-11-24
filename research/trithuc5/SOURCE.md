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

Expected SHA-256 for the current V5.4.6 build (fetched 2026-11-24T12:14:00Z):

```
2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c
```

Measured size: 2,777,970 bytes / 39,205 lines. Previous pins:

| Build | SHA-256 (prefix) | Notes |
|---|---|---|
| V5.4.6 (current) | `2dbf781e…` | Server-side grading, GForm disabled, 191 answerless exam shells, canonical seal literal |
| V4.8.6 | `ffe94aea…` | Server admin login, `/api/results`, KV disabled, admin/vault hash literals removed |
| V4.8.0 | `be27a5bc…` | Client-side admin session, public KV path still present |
| V4.6.7 | `8ec45ea6…` | Intermediate live check |
| V4.5 / V4.6.3 | `eff11902…` | Hash-literal vault, gzip/XOR exam store |
| V4.4 | `33be09d7…` | Original VIP seal chain analysis |

The test harnesses refuse to run if the measured hash differs. Pass the fetched file
explicitly: `export TRITHUC_SOURCE=/absolute/path/to/phase5/target.html`. If the site is
redeployed, re-measure line numbers and update `EXPECTED_SHA` in `harness.js`,
`phase4_harness.js` and `independent_verification.js` only after confirming the change is
intentional.

V5.4.6 line pins used by harnesses:

- hash functions and emptied literals: 4679–4704
- closure-vault variables: 3814–3826
- sensitive-storage regex: 4878
- memory store: 4845
- boot normalizer: 6314–6383
- remembered admin session restore: 6485–6497
- public cloud constants: 7051–7055
- cloud nonce registry: 8818
- seal validator: 19561–19582
- exam server hydration: 3940+
- exam server submit: 4025+
- results API GET (client): 7836
- renderApp: 31018; TRITHUC API: 31118

`evidence/source-refs.txt` lists the complete measured line map.
`evidence/test-results.txt` records the final run against the hash above.
