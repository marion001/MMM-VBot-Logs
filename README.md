# MMM-VBot-Logs

Module **MagicMirror²** hiển thị log realtime từ **VBot** thông qua WebSocket, sử dụng **tính năng Dev Logs (Code mẫu nằm ở file Dev_Logs.py) của VBot** để theo dõi hoạt động hệ thống trực tiếp trên màn hình.

<img src="https://img.shields.io/badge/MagicMirror-Module-blue" />
<img src="https://img.shields.io/badge/WebSocket-Realtime-green" />

---

## 📌 Tính năng

* 📡 Nhận log realtime từ **Dev Logs của VBot**
* 🔄 Tự động reconnect khi mất kết nối
* 🎨 Highlight log theo từ khóa (không cần type)
* ✂️ Tùy chọn cắt dòng (wrapText) hoặc dùng CSS
* 📜 Giới hạn số dòng log (tránh lag)
* ⬇️ Tự động scroll xuống dòng mới nhất
* 🧠 Server chỉ cần gửi dữ liệu đơn giản

---


## 🖼️ Demo

```
Đang kết nối...
✅ Kết nối thành công
chào bạn nhé
đang phát nhạc
🔌 Mất kết nối...
🔄 Đang kết nối lại (lần 1)...
```

---

## 🚀 Cài đặt

```bash
cd ~/MagicMirror/modules
git clone https://github.com/marion001/MMM-VBot-Logs.git
```

---

## ⚙️ Cấu hình

Thêm vào `config/config.js`:

```js
{
    module: "MMM-VBot-Logs",
    position: "top_right",
    config: {
        wsAddress: "ws://localhost:8765",
        maxLines: 20,
        reconnectInterval: 5,

        baseLength: 50,
        tolerance: 12,
        useWrapText: false,

        titleHeader: "Logs VBot MagicMirror",

        highlightKeywords: [
            { keyword: "đang chờ được đánh thức", className: "vbot-log-wait" },
            { keyword: "đã được đánh thức", className: "vbot-log-woke" },
            { keyword: "đang phát nhạc", className: "vbot-log-playing" }
        ]
    }
}
```

---

## 📡 Format dữ liệu WebSocket

Server chỉ cần gửi JSON đơn giản:

```json
{
    "text": "Nội dung log"
}
```

### Ví dụ:

```json
{
    "text": "chào bạn nhé"
}
```

---

## 🎨 Highlight log

Module sẽ tự động highlight dựa trên từ khóa:

```js
highlightKeywords: [
    { keyword: "đang chờ được đánh thức", className: "vbot-log-wait" },
    { keyword: "đã được đánh thức", className: "vbot-log-woke" },
    { keyword: "đang phát nhạc", className: "vbot-log-playing" }
]
```

👉 Không cần server gửi `type`
👉 Chỉ cần text là đủ

---

## 🔄 Cơ chế reconnect

* Khi lỗi xảy ra → `onerror`
* Socket sẽ tự đóng → `onclose`
* Module sẽ:

  * Log trạng thái
  * Đợi `reconnectInterval`
  * Tự kết nối lại

---

## 🧠 Gợi ý sử dụng

* Nên dùng `useWrapText: false` (mượt hơn)
* Giữ `maxLines` thấp (20–50) để tránh lag
* Dùng keyword để phân biệt trạng thái VBot

---

## 🐞 Debug

Nếu không nhận log:

* Kiểm tra WebSocket server có chạy không
* Kiểm tra `wsAddress`
* Mở DevTools (F12) → Console

---

## 📄 License

MIT

---

## 👨‍💻 Author

VBot Assistant, Vũ Tuyển
