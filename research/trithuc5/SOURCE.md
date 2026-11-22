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

Expected SHA-256 for the current V4.8.0 build (fetched 2026-11-22T04:48:27Z):

```
be27a5bc429dec25ec31031cf9128680bcc116b6eaa48c75bdb0e37896234028
```

Measured size: 9,115,471 bytes / 34,599 lines. The previous V4.5 / V4.6.3 pin was
`eff119024864bb4cfcc96ba2eeac44257e0c73c79456616091b6202535ab965f` (2026-11-21), and the
intermediate V4.6.7 live build was `8ec45ea6e68b6fc1589b881aae10d2dd5966f3970fc1a8694d5b2f9ce521328c`.

The test harnesses refuse to run if the measured hash differs. Pass the fetched file
explicitly: `export TRITHUC_SOURCE=/absolute/path/to/phase5/target.html`. If the site is
redeployed, re-measure line numbers and update `EXPECTED_SHA` in `harness.js`,
`phase4_harness.js` and `independent_verification.js` only after confirming the change is
intentional. V4.8.0 line pins in those harnesses are cloud constants 4298–4304, admin session
restore 3739–3751, boot normalizer 3574–3642, vault hash literals 2030–2054, closure-vault
variables 1993–2005, sensitive-storage filter line 2227 and nonce registry line 5713.

`evidence/source-refs.txt` lists historical function names and line ranges.
`evidence/test-results.txt` records the final run against the hash above.
