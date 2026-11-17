# Source artifact policy

The full verbatim public HTML is **not committed** to this repository because the target
publishes credential and signing literals inside it. Committing a copy would republish those
values. The reports therefore refer to source locations, and all credential values in reports,
logs and test fixtures are redacted.

To reproduce the analysis, fetch the public page yourself and verify its hash:

```bash
mkdir -p research/trithuc5
curl -sS -H 'Cache-Control: no-cache' \
  -o research/trithuc5/current.html \
  'https://trithuc500.vercel.app/?cb=audit'
sha256sum research/trithuc5/current.html
```

Expected SHA-256:

```
fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5
```

The test harness refuses to run if the measured hash differs. If the site is redeployed,
re-measure line numbers and update `EXPECTED_SHA` in `research/trithuc5/tests/harness.js`
only after confirming the change is intentional.

`evidence/source-refs.txt` lists every function and line range used by the tests.
`evidence/test-results.txt` records the final run against the hash above.
