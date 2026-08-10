# FRIDAY 🎀 — Trợ lý ảo 

Trợ lý ảo riêng của mình:

🔗 **Demo:** https://quangvinh-2011.github.io/FRIDAY/.

## Tính năng

- 💬 **Chat với FRIDAY** — gọi API AI tương thích chuẩn OpenAI, có tính cách riêng.
- ✅ **Việc cần làm** — thêm/xoá/đánh dấu hoàn thành, có hạn chót, cảnh báo quá hạn.
- ⏰ **Nhắc nhở** — đặt giờ, khi tới giờ FRIDAY tự nhắn tin nhắc trong khung chat + hiện toast + gửi Notification trình duyệt (nếu được cấp quyền).
- 📝 **Ghi chú nhanh** — lưu ý nghĩ, thông tin cần nhớ.
- 💾 Toàn bộ dữ liệu lưu trong `localStorage` — không cần đăng nhập, không mất dữ liệu khi tắt/mở lại trình duyệt trên cùng một máy.

## 🛠️ Tech Stack

Dự án viết hoàn toàn bằng **Vanilla HTML5, CSS3, và JavaScript (ES6+)** – không sử dụng framework, thể hiện nền tảng lập trình vững chắc:
* **DOM Manipulation & State Management** viết tay.
* **Web APIs:** `Fetch API` (`async/await`), `Web Storage API`, và `Notification API`.
* **UI/UX:** Thiết kế responsive, giao diện pastel hiện đại với hiệu ứng động mượt mà.

## ✨ Điểm nổi bật & Tính năng

* **AI Companion có ngữ cảnh:** Tích hợp API chuẩn OpenAI, hỗ trợ ghi nhớ thông tin cá nhân, ngữ cảnh trò chuyện và quản lý lịch trình.
* **All-in-One Productivity:** Quản lý **Việc cần làm** (có hạn chót/cảnh báo), **Nhắc nhở** (Browser Notification + Toast) và **Ghi chú nhanh**.
* **Zero-Backend & Local-First:** Toàn bộ dữ liệu vận hành qua `localStorage` – nhanh chóng, riêng tư, không cần đăng ký tài khoản.

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
Cảm ơn đã đọc 🎀
