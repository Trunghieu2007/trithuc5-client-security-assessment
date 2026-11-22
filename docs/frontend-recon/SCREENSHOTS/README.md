# Screenshot Index

All screenshots are PNG files captured from the live V5.1.1 build (`c4295c99…`) with `scale: 'css'`, except the two explicitly marked full-page captures.

Canonical copies: this directory.
Export copies: `C:\Users\Admin\Desktop\Misc\Miscs\WebSource`.

| # | File | Viewport | View / state | Theme | Notes |
| --- | --- | --- | --- | --- | --- |
| 01 | `01-desktop-1440-curriculum-default.png` | 1440×900 | `studentHome/curriculum`, default | system→light | Baseline desktop |
| 02 | `02-desktop-1440-exam-bank.png` | 1440×900 | `studentHome/examBank` | system→light | Two-column tree and exam cards |
| 03 | `03-desktop-1440-leaderboard.png` | 1440×900 | `studentHome/leaderboard` | system→light | Podium + table |
| 04 | `04-desktop-1440-dark-mode.png` | 1440×900 | `studentHome/leaderboard` | dark | Dark consistency check |
| 05 | `05-desktop-1440-expanded-chapter.png` | 1440×900 | `studentHome/curriculum`, chapter I expanded | system→light | Lesson cards and lock badges |
| 06 | `06-desktop-1440-student-login-modal.png` | 1440×900 | Student login modal | system→light | No credentials entered |
| 07 | `07-desktop-1440-admin-login-modal.png` | 1440×900 | Admin login gate | system→light | Server-auth gate only |
| 08 | `08-desktop-1440-curriculum-fullpage.png` | 1440× wide | `studentHome/curriculum`, full page | system→light | Full-page capture |
| 09 | `09-laptop-1280-curriculum.png` | 1280×800 | `studentHome/curriculum` | system→light | Laptop baseline |
| 10 | `10-tablet-768-curriculum.png` | 768×1024 | `studentHome/curriculum` | system→light | Tablet baseline |
| 11 | `11-tablet-768-exam-bank.png` | 768×1024 | `studentHome/examBank` | system→light | Tablet tree layout |
| 12 | `12-tablet-768-expanded-chapter.png` | 768×1024 | `studentHome/curriculum`, chapter expanded | system→light | Tablet lesson cards |
| 13 | `13-mobile-390-curriculum.png` | 390×844 | `studentHome/curriculum` | system→light | Mobile baseline; sticky nav 141px |
| 14 | `14-mobile-390-exam-bank.png` | 390×844 | `studentHome/examBank` | system→light | Mobile tree + filters |
| 15 | `15-mobile-390-curriculum-fullpage.png` | 390× tall | `studentHome/curriculum`, full page | system→light | Full-page capture |
| 16 | `16-mobile-390-dark-mode.png` | 390×844 | `studentHome/curriculum` | dark | Mobile dark consistency |
| 17 | `17-mobile-390-student-login-modal.png` | 390×844 | Student login modal | system→light | Mobile modal |
| 18 | `18-mobile-390-admin-login-modal.png` | 390×844 | Admin login gate | system→light | Mobile gate |
| 19 | `19-mobile-390-leaderboard.png` | 390×844 | `studentHome/leaderboard` | system→light | Mobile podium/table |
| 20 | `20-mobile-390-locked-course-modal.png` | 390×844 | VIP registration modal from 🔒 Khóa VIP | system→light | No submission |

## Capture order and state reset

* Pages were reloaded between modal checks to reset in-memory state.
* Theme was restored to `system` after dark-mode checks.
* No form values were filled; no login or registration request was sent.
* Exam and leaderboard numbers reflect live data at capture time and are not stable build fixtures.

## Related artifacts

* Accessibility snapshots: [`../SNAPSHOTS/`](../SNAPSHOTS/)
* Measurements: [`../RUNTIME_METRICS.json`](../RUNTIME_METRICS.json)
* Claims and gaps: [`../COVERAGE_REPORT.md`](../COVERAGE_REPORT.md)
