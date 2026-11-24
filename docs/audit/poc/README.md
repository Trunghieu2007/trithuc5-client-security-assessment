# PoC index — docs/audit

One folder per active/residual finding. Each folder contains a README plus expected/observed behavior. Canonical scripts remain in `research/trithuc5/poc/` and are validated by `tests/poc_suite_validation.js`.

| Finding | Type | Folder | Canonical script |
|---|---|---|---|
| NEW-11 | DISPLAY | `poc/NEW-11/` | `research/trithuc5/poc/poc_new11_seal_forgery.js` |
| F-01 | DISPLAY | `poc/F-01/` | `research/trithuc5/poc/poc_f01_student_data.js` |
| F-03 | ACTION | `poc/F-03/` | `research/trithuc5/poc/poc_f03_vip_entitlement.js` |
| NEW-13 | ACTION | `poc/NEW-13/` | `research/trithuc5/poc/poc_f03_vip_entitlement.js` |
| NEW-14 | DISPLAY | `poc/NEW-14/` | `research/trithuc5/poc/poc_new05_new07_new10_misc.js` |
| NEW-15 | DISPLAY | `poc/NEW-15/` | `research/trithuc5/poc/poc_new15_admin_preview.js` |
| F-02 | DISPLAY | `poc/F-02/` | `research/trithuc5/poc/poc_f02_admin_login.js` |
| F-05 | DISPLAY | `poc/F-05/` | `research/trithuc5/poc/poc_f05_device_lock.js` |
| NEW-07 | DISPLAY | `poc/NEW-07/` | `research/trithuc5/poc/poc_new05_new07_new10_misc.js` |
| NEW-10 | DISPLAY | `poc/NEW-10/` | `research/trithuc5/poc/poc_new05_new07_new10_misc.js` |
| NEW-08 | DISPLAY | `poc/NEW-08/` | `research/trithuc5/poc/poc_new08_new09_leakage.js` |
| F-04 | DISPLAY | `poc/F-04/` | `research/trithuc5/poc/poc_f04_exam_answers.js` |
| NEW-02 | ACTION | `poc/NEW-02/` | `research/trithuc5/poc/poc_new02_packet_injection.js` |
| F-06 | ACTION | `poc/F-06/` | `research/trithuc5/poc/poc_f06_anticheat.js` |
| NEW-03 | DISPLAY | `poc/NEW-03/` | `research/trithuc5/tests/phase3_tests.js` |
| NEW-05 | DISPLAY | `poc/NEW-05/` | `research/trithuc5/poc/poc_new05_new07_new10_misc.js` |
| NEW-06 | DISPLAY | `poc/NEW-06/` | `research/trithuc5/tests/run_all.js` |
| NEW-17 | DISPLAY | `poc/NEW-17/` | `research/trithuc5/poc/poc_new17_results_api.js` |

All PoCs use synthetic data. DISPLAY PoCs transmit nothing. ACTION PoCs change only local mechanism state and ship a restore function. No script writes to production ntfy/KV.
