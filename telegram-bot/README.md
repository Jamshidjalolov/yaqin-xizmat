# Yaqin Xizmat Telegram bot

Bot sayt ma'lumotlarini alohida saqlamaydi: xizmatlar, telefon bosishlari va xarita statistikasi mavjud FastAPI API orqali ishlaydi. Sayt va bot bitta backend ma'lumotlar bazasidan foydalanadi.

## Ishga tushirish

1. BotFather'da bot yarating va `telegram-bot/.env.example` faylidan `.env` faylini tayyorlang.
2. `BOT_TOKEN` qiymatini BotFather bergan token bilan to'ldiring.
3. `WEB_APP_URL` ga saytning ommaviy HTTPS manzilini yozing. Telegram Web App uchun internetdan ochiladigan HTTPS manzil kerak.
4. `API_BASE_URL` ga backend API ning bot ishlayotgan muhitdan ochiladigan manzilini yozing.
5. Backend `backend/.env` fayliga ham xuddi shu `TELEGRAM_BOT_TOKEN` qiymatini qo'shing. Mini App loginida Telegram imzosi shu token bilan tekshiriladi.
6. `WEB_APP_URL` domenini BotFather'da bot domeni sifatida sozlang.
7. Buyruqlar:

```powershell
cd telegram-bot
npm install
npm start
```

Botda `/start`, `/services`, `/categories`, `/search` buyruqlari, inline xizmat/kategoriya tanlash, qidiruv, telefon raqami va xarita tugmalari mavjud. Inline tugma bosilganda yuklanish holati ko'rsatiladi va so'rov davomida tugmalar takroriy bosishdan himoyalanadi. Xizmat rasmlari mavjud bo'lsa ko'rsatiladi, aks holda loyiha muqova rasmi ishlatiladi; kategoriyalar emojilar bilan belgilanadi. Bot chat menyusidagi **Open** tugmasi Mini App'ni ochadi.

## Deploy qilish

Repo rootidagi `render.yaml` FastAPI va Telegram bot uchun ikkita bepul Render web service yaratadi. Bot production'da Telegram webhook rejimiga o'tadi; `WEBHOOK_SECRET` Render tomonidan yaratiladi. Blueprint'ni GitHub repo'ga ulanganda:

- API service (`yaqin-xizmat-api`): mavjud Neon `DATABASE_URL`, backend `.env` dagi mavjud `SECRET_KEY`, va BotFather tokenini `TELEGRAM_BOT_TOKEN` sifatida kiriting.
- Bot service (`yaqin-xizmat-bot`): backend service'ning `https://...onrender.com` manzilini `API_BASE_URL` sifatida va xuddi shu BotFather tokenini `BOT_TOKEN` sifatida kiriting.
- Frontend production URL'i `https://yaqin-xizmat.netlify.app` bo'lib, `WEB_APP_URL` oldindan sozlangan.

### `BOT_TOKEN environment variable is missing` xatosi

Bu xato bot servisida `BOT_TOKEN` sozlanmaganini bildiradi. Render Dashboard'da `yaqin-xizmat-bot` servisining **Environment** bo'limiga o'ting va `BOT_TOKEN` nomli environment variable qo'shing. Qiymati API servisidagi `TELEGRAM_BOT_TOKEN` bilan aynan bir xil BotFather tokeni bo'lishi kerak. O'zgarishlarni saqlab, bot servisni qayta deploy qiling.

Telegram Mini App orqali backend login ishlashi uchun `yaqin-xizmat-api` servisidagi **Environment** bo'limida ham `TELEGRAM_BOT_TOKEN` bo'lishi kerak. Maxfiy tokenni Git'ga yoki kodga yozmang.

### `secret token contains illegal characters` xatosi

Render yaratgan `WEBHOOK_SECRET` qiymatida Telegram webhook qabul qilmaydigan belgilar bo'lishi mumkin. Bot xom qiymatni SHA-256 orqali Telegram qabul qiladigan hex formatiga o'tkazib, webhook o'rnatish va kelgan so'rovlarni tekshirishda aynan shu qiymatdan foydalanadi. Logda eski secret ko'rinib qolgan bo'lsa, Render Dashboard'da `yaqin-xizmat-bot` servisining `WEBHOOK_SECRET` qiymatini yangilang va botni qayta deploy qiling.

Render'ning bepul web service'lari uzoq vaqt so'rov bo'lmasa uxlab qolishi mumkin; bot yoki API birinchi so'rovda sovuq start bilan uyg'onadi. Ishlab chiqarishdagi doimiy ishlash uchun pulli doimiy servis kerak bo'lishi mumkin.

## Mini App sozlamasi

Frontend `.env` fayliga:

```env
VITE_API_BASE_URL=https://api.your-domain.uz
```

Backend va frontend internetdan foydalanish mumkin bo'lgan HTTPS manzillarga ega bo'lishi kerak. Backend'ning `DATABASE_URL` qiymatini o'zgartirish shart emas; bot ayni backend API va bazadan foydalanadi.
