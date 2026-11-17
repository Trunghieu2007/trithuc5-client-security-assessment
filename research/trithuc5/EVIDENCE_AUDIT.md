# Evidence audit — repository consistency

Repository: `Trunghieu2007/trithuc5-client-security-assessment`
Audited commit: `0a887db` plus working-tree changes from this revalidation pass.
Target source hash used throughout: `fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5`.

## Resolution of the seven known inconsistencies

1. **Test count mismatch — CONFIRMED, corrected.** `evidence/README.md` said 34 tests;
   `run_all.js` contained 35. The current suite contains **40** checks (35 original plus
   H-01, F-01-T15…T17, A-04-T02). `secure_controls.js` contains 9 post-patch controls.
   All documents now use 40 + 9.

2. **`INVESTIGATION.md` referenced `research/trithuc5/index.html` — CONFIRMED, corrected.**
   The file exists in commit `4675ab1` but was removed in `0a887db`. The path is now described
   as historical; current reproductions use `SOURCE.md` fetch instructions.

3. **Snapshot-not-committed statements — CONFIRMED correct for current tree.** `SOURCE.md` and
   `README.md` are right. The contradiction was in `INVESTIGATION.md`, `REPORT.md` and
   `HANDOFF.md`, which still described the removed file as present. Those references are now
   labeled historical; nothing was silently deleted from history — the file remains retrievable
   from commit `4675ab1`.

4. **Source path and line references — VERIFIED.** A fresh cache-busted fetch at
   `2026-11-17T19:00:09Z` returned HTTP 200, 14,226,000 bytes and the same SHA-256. Every line
   reference in the reports refers to that exact byte sequence. No old line number was reused
   against a different version.

5. **Severity/evidence agreement — PARTIAL, corrected in this pass.**
   - `REPORT.md` uses Vietnamese labels: CAO (admin, integrity, answers, cloud), TB (device),
     THẤP (anti-cheat). It does not contain the seven newer findings; it is a historical report.
   - `INVESTIGATION.md`, `FINDINGS_MATRIX.md` and `EXECUTIVE_SUMMARY.md` agreed on the original
     six before this pass.
   - Revalidation changes F-02 from Critical to High, NEW-04 from Low to Informational
     (amplifier), and NEW-06 from Informational to Informational (unchanged). Matrix and summary
     are updated accordingly.

6. **Test log provenance — CORRECTED.** `evidence/test-results.txt` had 354 NUL bytes appended
   because shell redirection and the script's own `fs.writeFileSync` targeted the same path.
   It has been regenerated without redirection: 0 NUL bytes, final line
   `TOTAL 40 PASS 40 FAIL 0`. It now matches the current `run_all.js`.

7. **`poc/last_run.log` vs `evidence/test-results.txt` — CORRECTED documentation.** Both were
   produced against the same source hash, but they are different suites: an early targeted PoC
   (exit 0) and the authoritative regression suite (exit 0). They are not expected to be
   identical, but `evidence/README.md` now says so explicitly.

## Stale, contradictory, or unsupported statements

| Statement | Location | Status | Correction |
|---|---|---|---|
| "34 tests, 34 pass" | `evidence/README.md` | Stale | 40 checks; plus 9 secure controls |
| "`current.html` … published as `research/trithuc5/index.html`" | `evidence/README.md` | Contradictory | Historical only; removed in `0a887db` |
| "They remain in the verbatim public HTML copy under `research/trithuc5/index.html`" | `INVESTIGATION.md` | Contradictory | Values remain on the target page, not in this repo |
| "File: `research/trithuc5/index.html`" | `REPORT.md` | Historical | Marked as historical artifact from initial commit |
| "`index.html` … read-only research copy" | `HANDOFF.md` | Historical | Marked as removed from current tree |
| "public topic has no cross-browser isolation" | old `F-01-T11` | Unsupported | Renamed; local VM acceptance only |
| "F-02 Critical" | original reports | Overstated | High: no server admin action exists |
| "NEW-04 Low independent vulnerability" | original matrix | Overstated | Informational amplifier; requires prior script execution |
| "replay causes damage" | original NEW-03 wording | Overstated | Only stale privileged packets can override newer state; duplicates are idempotent |

## Preserved historical evidence

- Commit `4675ab1` still contains the original `index.html`, `REPORT.md`, `HANDOFF.md`, PoC and
  headers. Nothing was rewritten in Git history.
- Commit `0a887db` contains the first sanitized investigation set and the deletion of the
  verbatim HTML from the current tree.
- The present pass adds new files and corrected documents without removing prior commits.

## Current evidence index

- Authoritative behavioral/static suite: `tests/run_all.js` → `evidence/test-results.txt`
  (40 pass, 0 fail).
- Post-patch acceptance controls: `tests/secure_controls.js` →
  `evidence/secure-controls-before-patch.txt` (1 pass, 8 fail expected).
- Sanitized targeted PoC: `poc/poc_client.js` → `poc/last_run.log` (exit 0).
- Fresh fetch metadata: `revalidation/fetch.info`, `target.headers`, `target.html` are kept
  locally only; the raw HTML is not published.
