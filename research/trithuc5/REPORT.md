# TRITHUC5.0 V4.3.9 — Đánh giá cơ chế bảo vệ client-side

**Target:** `https://trithuc500.vercel.app/`  
**Phạm vi:** client-side only. Không brute-force Vercel, không DoS, không tạo tài khoản thật, không ghi vào ntfy/KV công khai.  
**Artifact đã đo:** bản sao HTML công khai, 14.226.000 byte, 15.912 dòng, SHA-256 `fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5`. File: `research/trithuc5/index.html`.  
**PoC đã chạy:** `node research/trithuc5/poc/poc_client.js` → exit code `0`, mọi assertion đạt. Script trích **hàm thật từ source** và thực thi cục bộ; không gọi API ghi của target.

**Redaction:** mọi giá trị credential, salt, chữ ký và khóa đã bị thay bằng `[REDACTED_*]`. Các vị trí source vẫn được giữ nguyên để tra cứu; bản HTML công khai chứa các literal gốc.

---

## 1. Admin auth — CAO

**Vị trí code**
- `state.adminCreds` — dòng 1505–1508: `username: atob('[REDACTED]')`, `password: atob('[REDACTED]')`.
- `submitAdminLogin` — dòng 13999–14004: danh sách user hợp lệ gồm `state.adminCreds.username`, `atob('[REDACTED]')`, `atob('[REDACTED_ALIAS]')`; password hợp lệ gồm `state.adminCreds.password` và `atob('[REDACTED]')`.
- `computeAdminSessionSig` — dòng 2821–2824: `ADM_SESS|<user>|<ts>|[REDACTED_ADMIN_SALT]` → `adm_ + hashStringHex(raw)`.
- Khôi phục session — dòng 2398–2405: chấp nhận session nếu `!parsedSess.sig || parsedSess.sig === expectedSig`, trong vòng 7 ngày.
- Khóa 60 giây sau 5 lần sai — dòng 14022–14028: chỉ là `state` trong RAM, reset khi tải lại trang.

**PoC đã thực thi (local)**
```
decoded admin username: [REDACTED]
decoded admin password: [REDACTED]
forged session: {"loggedIn":true,"username":"[REDACTED]","ts":1795000000000,"sig":"[REDACTED]"}
```
Các bước tái lập trong profile riêng:
1. Mở target, F12 → Console.
2. Gõ `atob('[REDACTED]')` và `atob('[REDACTED]')` → credentials.
3. Đăng nhập qua modal Quản trị bằng cặp đó, hoặc bỏ qua hoàn toàn: ghi `localStorage['TRITHUC50_REMEMBER_ADMIN_SESSION_V26'] = JSON.stringify({loggedIn:true,username:'[REDACTED]',ts:Date.now(),sig:...})` với `sig` tính bằng `computeAdminSessionSig` trong source.
4. Reload → dòng 2405 đặt `state.isAdminLoggedIn = true`.

**Thiệt hại thực tế:** bất kỳ ai tải trang đều có quyền Quản trị trong browser của họ: duyệt VIP, sửa đề, xóa user trong state locally, và đẩy packet `fromAdmin:true` ra kênh đồng bộ dùng chung. Không cần tài khoản, không cần đoán mật khẩu.

**Bản vá:** xóa hoàn toàn so sánh credential khỏi client. Đăng nhập qua endpoint server-side, mật khẩu lưu dưới dạng Argon2id/bcrypt, so sánh constant-time, trả cookie `HttpOnly; Secure; SameSite=Strict` hoặc JWT ngắn hạn do server ký. Salt session chỉ tồn tại ở server. Giới hạn đăng nhập và audit log ở server. Xoay mật khẩu quản trị và mọi salt đã lộ.

---

## 2. Toàn vẹn dữ liệu / VIP — CAO

**Vị trí code**
- `computeUserIntegritySig` — dòng 2806–2819. Raw string có cờ VIP, `vipPlan`, `vipExpiresAt`, gmail, `maxDevices` + salt literal `[REDACTED_INTEGRITY_SALT]`; hash 2×32-bit, output `v27_<16 hex>`.
- `verifyRuntimeSecurityIntegrity` — dòng 2826–2846, chỉ so sánh `stu._sig !== computeUserIntegritySig(stu)` rồi thu hồi VIP trong RAM.
- Dòng 3910: hàm này được gọi mỗi 2 giây bởi radar anti-cheat.

**PoC đã thực thi (local)**
```
original _sig:   [REDACTED]
recomputed _sig: [REDACTED]
```
User mẫu chuyển từ không VIP sang `k12/k11/k10/luyende = true`, `vipPlan='lifetime'`, `maxDevices=999` rồi tự gán `_sig` mới → vừa khớp kiểm tra ở dòng 2832.

**PoC trên profile riêng:**
1. Đăng nhập một tài khoản bất kỳ (hoặc tự tạo user local trong `TRITHUC50_USERS_V436_CLEAN`).
2. Console: sửa object user trong `localStorage['TRITHUC50_LOGGED_STUDENT_V436']` và trong mảng users: `vipPackages` all true, `vipPlan='lifetime'`, `vipExpiresAt=null`, `maxDevices=999`.
3. Gọi hàm `computeUserIntegritySig(u)` từ source, gán kết quả vào `u._sig`, ghi lại localStorage, reload.
4. `isStudentVipExpired` (dòng 2859–2866) trả `false`, VIP vĩnh viễn; radar ở dòng 3910 không thu hồi vì chữ ký khớp.

**Thiệt hại thực tế:** mọi quyết định cấp VIP/hạn thiết bị đều dựa trên dữ liệu do chính client ký bằng khóa công khai trong source. Đây là checksum, không phải HMAC, và không có server xác thực. Mất doanh thu và mất khả năng giới hạn thiết bị.

**Bản vá:** server là nguồn chân duy nhất cho entitlement. Client gọi API authenticated để lấy trạng thái VIP/devices; mọi thay đổi chỉ có hiệu lực sau server ghi nhận. Xóa path "tự thu hồi VIP khi `_sig` lệch" như một cơ chế bảo mật. Nếu cần chống chỉnh sửa ngoại tuyến, dùng HMAC với khóa phiên do server cấp và vẫn không dùng để quyết định quyền.

---

## 3. Device lock + Gmail binding — TB

**Vị trí code**
- `getHardwareDeviceProfile` — dòng 2591–2655. `installToken` đọc/ghi `TRITHUC50_DEVICE_HW_TOKEN` ở localStorage (dòng 2613–2618); deviceId = token đó.
- Dòng 2620–2642: chế độ giả lập `sim_dev2` / `sim_dev3_intruder` trả deviceId cố định.
- `setSimulatedDeviceSlot` — dòng 13430–13440, public qua `window.TRITHUC` (dòng 12284) và có nút UI ở dòng 5613–5621, 10188–10196.
- `verifyAndBindStudentDeviceOnLogin` — dòng 2683–2803. So khớp `d.deviceId === dev.deviceId` (dòng 2727); nếu `trustedDevices.length < maxDev` thì tự thêm (dòng 2743–2763); vượt giới hạn thì tăng `deviceShareViolations`, có thể set `status='locked'` (dòng 2766–2784) và trả `ok:false` (dòng 2798–2802).
- Gmail chỉ là so sánh chuỗi với `u.gmail` trong cùng object local (dòng 2692–2724).

**PoC tái lập:**
1. Trên profile riêng, Console: `window.TRITHUC.setSimulatedDeviceSlot('real')`.
2. Sửa `trustedDevices` trong `TRITHUC50_USERS_V436_CLEAN` thành `[]` hoặc ghi đè `deviceId` của một entry bằng `getHardwareDeviceProfile().deviceId`.
3. Tính lại `_sig` như mục 2, reload, đăng nhập → nhánh dòng 2743 tự gắn device mới.
4. Để test chặn thật: `window.TRITHUC.setSimulatedDeviceSlot('sim_dev3_intruder')` rồi đăng nhập. Lần đầu/ lần hai chỉ tăng counter; ở `maxViolationsBeforeLock` (mặc định 2) mới set `status='locked'`.

**Đánh giá:** chặn thiết bị thứ 3 **có thật trong luồng đăng nhập client** (`ok:false`), không chỉ ẩn UI. Nhưng toàn bộ dữ liệu quyết định nằm ở localStorage và có thể tự ký lại, nên thực tế chỉ chặn người không mở DevTools. Gmail binding tương tự: `u.gmail` có thể sửa trực tiếp. Nút giả lập thiết bị được ship trong production.

**Bản vá:** thiết bị phải do server đăng ký và lưu server-side; token thiết bị không được lấy từ localStorage thuần túy. Yêu cầu xác thực ngoài băng (OTP email) khi thêm thiết bị mới hoặc mở khóa. Lock status phải do server trả về, không phải `u.status` trong localStorage. Gỡ `setSimulatedDeviceSlot` và các nút giả lập khỏi bản production.

---

## 4. Đáp án đề thi — CAO

**Vị trí code**
- `window.__INITIAL_EXAMS_DATA__` — dòng 1047: 15 đề, mỗi đề có `correctAnswers` dạng plaintext. Ví dụ đề đầu: `{"p1":{"1":"B","2":"C","3":"D","4":"C","5":"A",...}}`.
- `makeMatExam` — dòng 1098 và dòng 1267: `correctAnswers: {p1: cp1, p2: cp2, p3: cp3}`.
- `decryptV97EmbedPayload` — dòng 4346–4370; key = `"TRUNG_SEC_2026_" + INTEGRITY_SIG`, phép biến đổi `((b ^ k) - (i*7 % 256) + 256) % 256`.
- `parseV97HtmlOrJsonString` — dòng 4384–4387: regex lấy `ENC_PAYLOAD` và `INTEGRITY_SIG`.

**Kết quả đo được**
- Trang hiện tại **không chứa hằng `ENC_PAYLOAD` thật**; chỉ có parser. PoC tạo payload tổng hợp từ `correctAnswers` thật, mã hóa bằng đúng công thức nghịch, rồi đưa lại vào hàm giải mã trích từ source → khớp 100%.
- Dạng nghịch đúng: `enc[i] = ((plain[i] + (i*7 % 256)) % 256) ^ k`. (Lần thử đầu dùng `((plain ^ k) + shift)`, không khớp — đã sửa; đây là lỗi của PoC, không phải target.)

**PoC tái lập:**
1. `node research/trithuc5/poc/poc_client.js` → xem dòng `decrypt(correctAnswers match): true`.
2. Trên browser: `window.__INITIAL_EXAMS_DATA__[i].correctAnswers` → toàn bộ đáp án mọi đề, không cần giải mã gì.

**Thiệt hại thực tế:** đáp án được gửi cùng đề thi cho mọi client. Lớp "mã hóa XOR" là obfuscation, key nằm ngay trong source và `INTEGRITY_SIG` do người dùng cung cấp. Watermark/prompt trap không cứu được lỗi này.

**Bản vá:** không bao giờ đưa `correctAnswers` vào payload gửi client. Chỉ gửi câu hỏi; đáp án nằm server, trả về sau khi nộp bài hoặc cho admin đã xác thực. Thay XOR bằng AES-GCM với key server không bao giờ rời server, kèm nonce. Xoay mọi key/salt đã xuất hiện trong source.

---

## 5. Cloud sync (ntfy.sh + KV) — CAO

**Vị trí code**
- Topic/endpoint/app key — dòng 2918–2924: `trithuc50_v436_live_sync_hn`, `trithuc50_v436_bak_sync_hn`, `https://ntfy.sh/<topic>`, `tt50v436hn`, `https://keyvalue.immanuel.co/api/KeyVal/{GetValue,UpdateValue}/tt50v436hn/`.
- `computeCloudPacketAdminSig` — dòng 2975–2983: `TT50_ADM_PKT_V436|<ts>|<hideAuthor>|<delKeys>|<users>|[REDACTED_CLOUD_SECRET]` → `asig_ + hashStringHex`.
- `pushCloudSyncPacket` — dòng 3282–3345: POST ntfy không có header auth (chỉ `Content-Type`, dòng 3311–3315), ghi KV qua URL key công khai.
- `processIncomingCloudPacket` — dòng 3142–3268. Dòng 3145:
  `isVerifiedAdmin = Boolean(data.fromAdmin && (!data.adminSig || data.adminSig === computeCloudPacketAdminSig(data)))`.
- **Quan trọng:** dòng 3161–3188 hợp nhất `deletedMap` / `deletedUsernames` và lọc `state.users` **trước và không phụ thuộc** `isVerifiedAdmin`.
- Dòng 3224–3237: merge user chỉ khi có adminSig hợp lệ, nhưng `fromAdmin` và secret đều lấy được từ source.

**PoC đã thực thi (local, không gửi đi)**
```
forged adminSig: [REDACTED]
```
Script tạo packet `fromAdmin:true` với `deletedMap` và user giả, ký bằng secret trích từ source, và xác nhận assertion: dòng 3145 chấp nhận gói **thiếu adminSig**, dòng 3161 áp dụng tombstone mà không kiểm tra quyền.

**Đọc kênh công khai:** GET `/json?poll=1&since=24h` tới ntfy topic bị timeout sau 10s (0 byte); HEAD trả 404 từ nginx proxy. KV `GET .../meta_cnt` trả HTTP 503 tại thời điểm thử. Vì vậy **không quan sát được packet thật trong session này** — chỉ chứng minh được cấu hình public và code path xử lý.

**Điểm dừng theo yêu cầu:** tôi đã phát hiện đường tấn công ảnh hưởng dữ liệu người khác — gói tin giả có `deletedMap` khiến **client của học sinh khác** xóa user khỏi state/localStorage của họ. Tôi **không** gửi packet thử, không ghi ntfy/KV, và dừng mọi thử nghiệm live tại đây để hỏi ý kiến.

**Thiệt hại thực tế:** kênh pub/sub không auth, secret ký nằm trong client, và một phần xử lý (tombstone) không kiểm tra chữ ký. Kẻ tấn công có thể gây xóa tài khoản/đè trạng thái trên client của người khác mà không cần tài khoản. Không phải chiếm quyền server, nhưng là thao túng dữ liệu người dùng khác.

**Bản vá:** đưa đồng bộ qua broker authenticated. Mỗi user/topic có khóa riêng; mọi packet phải có chữ ký server (Ed25519/HMAC với secret server) **và** timestamp + nonce chống replay. Kiểm tra chữ ký trước **mọi** mutation, kể cả tombstone. Xóa điều kiện `!data.adminSig`. KV app key và ntfy topic không được coi là bí mật — chuyển sang backend proxy có ACL. Server vẫn là nguồn chân lý; client không tự merge users từ broadcast công khai.

---

## 6. Anti-cheat (F12 / copy / fullscreen / watermark / idle-blur) — THẤP

**Vị trí code**
- `setupAntiCheatListeners` — dòng 3784–3923:
  - `visibilitychange`, `fullscreenchange`, `blur` → `triggerExamViolation` (dòng 3791–3815).
  - `contextmenu/copy/cut/dragstart/selectstart` → `e.preventDefault()` (dòng 3821–3836).
  - F12/Ctrl+Shift+I/Ctrl+U/PrintScreen → `preventDefault` + toast (dòng 3851–3885).
  - Idle blur: sau 35 s thêm class `show` vào `#idleBlurBanner`, CSS `filter: blur(22px)` (dòng 3913–3920; CSS dòng 213–214).
- Radar 2 giây — dòng 3909–3922, gọi `scanAndBlockAIExtensions` và `verifyRuntimeSecurityIntegrity`.
- `scanAndBlockAIExtensions` — dòng 3696–3725: nếu watermark mất thì `renderApp()` dựng lại; nếu thấy DOM của extension thì `found.remove()`.
- Watermark là 24 `<div>` thuần DOM — dòng 9053–9054.
- `triggerExamViolation` — dòng 3925–3945: đếm `state.tabSwitches`, tới `maxTabSwitches` thì `finalizeExamSubmission(true)`.

**PoC tái lập (không cần công cụ đặc biệt):**
1. Console DevTools: `document.removeEventListener` không cần — chỉ cần `window.TRITHUC` hoặc tắt JS breakpoint trước khi event; hoặc mở DevTools bằng chuột phải → Inspect (không qua phím bị chặn).
2. `document.body.classList.remove('anti-copy-shield-v43')`, `document.getElementById('watermarkLayer')?.remove()` — radar dựng lại, nhưng có thể override `window.TRITHUC.scanAndBlockAIExtensions = ()=>{}` hoặc xóa `antiAiConfig.watermark`.
3. Để vô hiệu tự nộp bài, ghi override `localStorage['TRITHUC50_EXAM_OVERRIDES_V26'] = JSON.stringify({'<examId>': {maxTabSwitches: 0}})` rồi reload. Dòng 2067–2097 áp dụng override này vào đề trước khi `state.exams` được tạo; dòng 3937–3940 chỉ tự nộp khi `limit > 0`. Không cần chạm vào biến `state` trong closure.
4. Screenshot bằng OS/camera ngoài ứng dụng không tạo `PrintScreen` keydown → CSS blur không kích hoạt.

**Đánh giá thực tế:** toàn bộ là veneer UX. `preventDefault` chỉ chặn phím, không chặn DevTools mở bằng menu; DOM có thể bị xóa/ghi đè; blur là CSS class. Điểm duy nhất có hậu quả là tự nộp bài sau N vi phạm, nhưng counter cũng nằm trong state client. Xếp THẤP vì không tạo ra bí mật hay quyền, chỉ gây khó chịu.

**Bản vá:** ngừng gọi các lớp này là "bảo mật". Nếu muốn chống gian lận thật: thời gian làm bài và nộp bài do server tính; chấm điểm server-side; log bất thường (thời gian trả lời, thứ tự câu, pattern đáp án) ở server; watermark render server-side cho từng phiên. Giữ `preventDefault` như cảnh báo UX, không như kiểm soát.

---

## Bảng tổng hợp theo mức độ

| Mức | Bề mặt | Vị trí chính (dòng) | Bypass đã chứng minh | Thiệt hại thực tế | Trạng thái kiểm chứng |
|---|---|---|---|---|---|
| CAO | Cloud sync / ntfy + KV | 2918–2924, 2975–2983, 3145, 3161–3188 | Secret trong source; chấp nhận thiếu `adminSig`; tombstone không cần quyền | Ảnh hưởng client của user khác (xóa/đè state) | Static + PoC local; **live test DỪNG, chờ xác nhận** |
| CAO | Admin auth | 1505–1508, 13999–14004, 2398–2405, 2821–2824 | Credentials base64; session tự ký; alias `admin` | Quyền Quản trị trong browser bất kỳ | PoC local chạy, exit 0 |
| CAO | Đáp án đề thi | 1047, 1098, 1267, 4346–4387 | `correctAnswers` plaintext; XOR key public | Lộ toàn bộ đáp án | PoC local chạy, exit 0 |
| CAO | Toàn vẹn dữ liệu / VIP | 2806–2819, 2826–2846, 3910 | Salt hard-code, tự tính `_sig` | VIP vĩnh viễn, bỏ giới hạn thiết bị | PoC local chạy, exit 0 |
| TB | Device lock + Gmail | 2613–2642, 2683–2803, 13430–13440 | `trustedDevices=[]` / ghi đè deviceId / nút giả lập | Chặn thật trong client nhưng dễ ghi đè | Static + PoC local |
| THẤP | Anti-cheat DOM/phím | 3784–3945, 3696–3725, 9053–9054 | DevTools menu, xóa DOM/class, override hàm | Chỉ UX; không bảo vệ bí mật hay quyền | Static; chưa chạy browser automation |

## Giới hạn và dữ liệu chưa có

- Không tạo tài khoản thật, không đăng nhập vào dữ liệu của người khác.
- Không POST vào ntfy/KV; không gửi packet giả. Đây là điều kiện dừng bạn đưa ra.
- Không đọc được packet công khai trong session này: ntfy GET timeout, KV GET 503.
- Không chạy browser automation trên profile thật; PoC anti-cheat là mô tả tái lập, không phải kết quả quan sát được.
- Mọi số dòng trên được lấy từ file `research/trithuc5/index.html` với SHA-256 như đầu báo cáo. Nếu target deploy bản mới, phải đo lại.
