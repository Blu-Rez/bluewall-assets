CH1 · 50% · انجام‌شده: سرور کامل (chat.py + chat_defaults.json + server.py.diff + ROUTES.md) و تست سرور ۳۶۲ چک سبز روی حافظه + Redis واقعی + ۵ حساب روی HTTP · بعدی: chatui.js (۳ تب، حالت کیبورد، quick-chat، hubEntry/profileAction) + قاب‌ها + gate نهایی · گیر: ندارد

# CH1 — چت (جهانی · کلن · پیوی دوست) — گزارش موقت (سرور push شده)

## چی هست
- `server_patch/NEW/chat.py` + `chat_defaults.json` + `server.py.diff` (فقط ۲ خط علامت‌دار `# CH1:`) + `ROUTES.md`.
- تست: `python3 dev/ch1_server_test.py` ← `CH1 SERVER OK` (روی یک کپی ادغام‌شدهٔ kit در /tmp اجرا می‌شود؛ به درخت kit دست نمی‌زند).

## ثابت‌نشده (تا اینجا)
- رفتار کیبورد واقعی تلگرام (هنوز کلاینت ساخته نشده).
- چند-پراسس بودن سرور (چت فرض می‌کند یک پراسس؛ در ROUTES.md نوشته شده).
