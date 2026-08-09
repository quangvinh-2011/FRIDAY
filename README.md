# FRIDAY 🎀 — Trợ lý ảo cá nhân

Trợ lý ảo riêng của Quang Vinh: chat AI dễ thương phong cách genz, quản lý việc cần làm, đặt nhắc nhở và ghi chú nhanh — tất cả trong một web app chạy hoàn toàn phía trình duyệt, không cần backend.

🔗 **Demo:** bật GitHub Pages cho repo này rồi dán link vào đây.

## Tính năng

- 💬 **Chat với FRIDAY** — gọi API AI tương thích chuẩn OpenAI, có tính cách riêng: gọi bạn là "Cậu Chủ", nói chuyện genz dễ thương, biết ngày sinh / cung hoàng đạo / trường của bạn để trả lời tự nhiên hơn. FRIDAY còn biết việc đang dang dở và nhắc nhở sắp tới để trò chuyện có ngữ cảnh.
- ✅ **Việc cần làm** — thêm/xoá/đánh dấu hoàn thành, có hạn chót, cảnh báo quá hạn.
- ⏰ **Nhắc nhở** — đặt giờ, khi tới giờ FRIDAY tự nhắn tin nhắc trong khung chat + hiện toast + gửi Notification trình duyệt (nếu được cấp quyền).
- 📝 **Ghi chú nhanh** — lưu ý nghĩ, thông tin cần nhớ.
- 💾 Toàn bộ dữ liệu lưu trong `localStorage` — không cần đăng nhập, không mất dữ liệu khi tắt/mở lại trình duyệt trên cùng một máy.
- 🎨 Giao diện "mood orb" xoay màu, theme genz hồng-pastel trên nền tối, có lời chào tự động đổi theo giờ trong ngày.

## Công nghệ

Vanilla **HTML / CSS / JavaScript**, không framework. Toàn bộ state, gọi API, lưu trữ local đều viết tay để thể hiện hiểu biết nền tảng: DOM, `fetch`/`async-await`, Web Storage API, Notification API.

## Chạy thử

```bash
npx serve .
# hoặc
python3 -m http.server 8080
```

Mở trình duyệt tới địa chỉ local server hiện ra là dùng được ngay.

## Cấu hình API key

FRIDAY gọi thẳng API AI từ trình duyệt (bấm nút ⚙ **Cài đặt**), nên đây là ứng dụng client-side thuần — không có backend để giấu key hoàn toàn. Vì vậy:

- Key chỉ được lưu trong `localStorage` của máy bạn, **không** commit vào GitHub.
- Muốn public demo an toàn cho người khác dùng, nên thêm một backend nhỏ (Cloudflare Worker / Node) làm proxy giấu key — hướng phát triển tiếp theo.

Một vài API tương thích OpenAI có thể dùng:

| Provider | Base URL | Ghi chú |
|---|---|---|
| Pollinations | `https://gen.pollinations.ai/v1` | có model miễn phí, key tại enter.pollinations.ai |
| OpenRouter | `https://openrouter.ai/api/v1` | có nhiều model free tier |
| Groq | `https://api.groq.com/openai/v1` | tốc độ phản hồi rất nhanh |
| OpenAI | `https://api.openai.com/v1` | trả phí |

## Cấu trúc project

```
friday-assistant/
├── index.html      # cấu trúc UI: header, tabs, 4 panel, modal cài đặt
├── style.css        # theme genz pastel, responsive, mood orb animation
├── script.js         # state management, chat AI, tasks, reminders, notes
└── README.md
```

## Hướng phát triển tiếp

- [ ] Cho FRIDAY tự thêm việc/nhắc nhở qua câu lệnh chat (function calling)
- [ ] Streaming phản hồi chat thay vì chờ trọn câu
- [ ] Backend proxy nhỏ để giấu API key khi public demo
- [ ] Đồng bộ dữ liệu qua nhiều thiết bị (hiện chỉ lưu local)

---
Made with 🎀 as a portfolio project.
