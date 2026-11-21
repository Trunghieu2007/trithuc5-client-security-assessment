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

Expected SHA-256 for the current V4.5 / V4.6.3 build (fetched 2026-11-21):

```
eff119024864bb4cfcc96ba2eeac44257e0c73c79456616091b6202535ab965f
```

The test harnesses refuse to run if the measured hash differs. Pass the fetched file
explicitly: `export TRITHUC_SOURCE=/absolute/path/to/phase5/target.html`. If the site is
redeployed, re-measure line numbers and update `EXPECTED_SHA` in `harness.js`,
`phase4_harness.js` and `independent_verification.js` only after confirming the change is
intentional.

`evidence/source-refs.txt` lists every function and line range used by the tests.
`evidence/test-results.txt` records the final run against the hash above.
