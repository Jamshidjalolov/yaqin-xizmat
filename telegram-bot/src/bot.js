import "dotenv/config";
import { createServer } from "node:http";
import { createHash, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Bot, InlineKeyboard, InputFile } from "grammy";

const botToken = process.env.BOT_TOKEN;
const apiBaseUrl = (process.env.API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
const webAppUrl = process.env.WEB_APP_URL;
const pageSize = 6;
const port = Number(process.env.PORT);

if (!botToken) {
  throw new Error("BOT_TOKEN environment variable is missing. Set it in Render Dashboard > yaqin-xizmat-bot > Environment.");
}

if (!webAppUrl) {
  throw new Error("WEB_APP_URL .env faylida ko'rsatilishi kerak");
}

const parsedWebAppUrl = new URL(webAppUrl);
const miniAppEnabled = parsedWebAppUrl.protocol === "https:";
if (!miniAppEnabled && parsedWebAppUrl.hostname !== "localhost") {
  throw new Error("WEB_APP_URL HTTPS manzil bo'lishi kerak");
}

const bot = new Bot(botToken);
const searchChats = new Set();
const searchQueries = new Map();
const processingMessages = new Set();
const welcomePhoto = new InputFile(
  await readFile(new URL("../../frontend/public/welcome_bg.png", import.meta.url)),
  "yaqin-xizmat.png",
);

const categoryIcons = [
  { words: ["santex", "suv", "quvur"], icon: "🚿" },
  { words: ["elektr", "elektrik"], icon: "⚡" },
  { words: ["dorix", "farm"], icon: "💊" },
  { words: ["go'zallik", "beauty", "soch"], icon: "💇" },
  { words: ["tozalash", "clean"], icon: "🧹" },
  { words: ["avto", "mashina"], icon: "🚘" },
  { words: ["qurilish", "remont"], icon: "🧱" },
  { words: ["oshpaz", "taom", "ovqat"], icon: "🍽️" },
  { words: ["repetitor", "ta'lim"], icon: "📚" },
];

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function categoryIcon(category = "") {
  const normalized = category.toLocaleLowerCase("uz");
  return categoryIcons.find(({ words }) => words.some((word) => normalized.includes(word)))?.icon || "🛠️";
}

async function servicePhoto(imageUrl) {
  if (!imageUrl) return welcomePhoto;

  try {
    const image = new URL(imageUrl, apiBaseUrl);
    if (/^\/uploads\/[A-Za-z0-9._-]+$/.test(image.pathname)) {
      const response = await fetch(`${apiBaseUrl}${image.pathname}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok || !(response.headers.get("content-type") || "").startsWith("image/")) {
        throw new Error(`Backend service image fetch failed (HTTP ${response.status})`);
      }
      const extension = image.pathname.match(/\.(jpe?g|png|webp|gif)$/i)?.[0] || ".jpg";
      return new InputFile(Buffer.from(await response.arrayBuffer()), `service${extension}`);
    }
    return image.protocol === "https:" ? image.toString() : welcomePhoto;
  } catch (error) {
    console.warn("Xizmat rasmi yuklanmadi, muqova rasmi ishlatiladi:", error);
    return welcomePhoto;
  }
}

function hasTelegramPhoto(message) {
  return message && "photo" in message && Boolean(message.photo?.length);
}

async function replyWithPhoto(ctx, photo, caption, replyMarkup) {
  if (ctx.callbackQuery?.message && hasTelegramPhoto(ctx.callbackQuery.message)) {
    try {
      await ctx.editMessageMedia(
        { type: "photo", media: photo, caption, parse_mode: "HTML" },
        { reply_markup: replyMarkup },
      );
    } catch (error) {
      if (photo === welcomePhoto) throw error;
      console.warn("Xizmat rasmi yuborilmadi, sayt rasmi ishlatiladi:", error);
      await ctx.editMessageMedia(
        { type: "photo", media: welcomePhoto, caption, parse_mode: "HTML" },
        { reply_markup: replyMarkup },
      );
    }
    return;
  }

  try {
    await ctx.replyWithPhoto(photo, {
      caption,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    });
  } catch (error) {
    if (photo === welcomePhoto) throw error;
    console.warn("Xizmat rasmi yuborilmadi, sayt rasmi ishlatiladi:", error);
    await ctx.replyWithPhoto(welcomePhoto, {
      caption,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    });
  }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Backend so'rovi bajarilmadi (HTTP ${response.status})`);
  }

  return response.json();
}

function appKeyboard() {
  return miniAppEnabled ? new InlineKeyboard().webApp("📱 Ilovada ochish", webAppUrl) : undefined;
}

function serviceAppUrl(serviceId) {
  if (!miniAppEnabled) return webAppUrl;
  const url = new URL(webAppUrl);
  url.searchParams.set("service_id", String(serviceId));
  return url.toString();
}

function mainKeyboard() {
  const keyboard = new InlineKeyboard()
    .text("🛠 Xizmatlar", "services:0")
    .text("📂 Kategoriyalar", "categories:0")
    .row()
    .text("🔎 Qidirish", "search");
  if (miniAppEnabled) keyboard.row().webApp("📱 Ilovada ochish", webAppUrl);
  return keyboard;
}

function pageKeyboard(items, page, itemCallback, pageCallback, labelForItem, valueForItem, totalCount = items.length) {
  const keyboard = new InlineKeyboard();
  for (const [index, item] of items.entries()) {
    keyboard.text(labelForItem(item), `${itemCallback}:${valueForItem(item, page * pageSize + index)}`).row();
  }
  const pageData = (targetPage) => typeof pageCallback === "function" ? pageCallback(targetPage) : `${pageCallback}:${targetPage}`;
  if (page > 0) keyboard.text("⬅️ Oldingi", pageData(page - 1));
  if ((page + 1) * pageSize < totalCount) keyboard.text("Keyingi ➡️", pageData(page + 1));
  keyboard.row().text("🏠 Bosh menyu", "menu");
  if (miniAppEnabled) keyboard.webApp("📱 Ilovada ochish", webAppUrl);
  return keyboard;
}

async function replyOrEdit(ctx, text, replyMarkup) {
  if (ctx.callbackQuery?.message) {
    if (hasTelegramPhoto(ctx.callbackQuery.message)) {
      await ctx.editMessageCaption({ caption: text, parse_mode: "HTML", reply_markup: replyMarkup });
    } else {
      await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: replyMarkup });
    }
  } else {
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: replyMarkup });
  }
}

async function showServices(ctx, page = 0, category = "") {
  const query = new URLSearchParams();
  if (category) query.set("category", category);
  const services = await apiRequest(`/services${query.size ? `?${query}` : ""}`);
  if (!services.length) {
    await replyOrEdit(ctx, "Hozircha bu bo'limda xizmatlar topilmadi.", mainKeyboard());
    return;
  }

  const start = page * pageSize;
  const items = services.slice(start, start + pageSize);
  const heading = category
    ? `${categoryIcon(category)} <b>${escapeHtml(category).toLocaleUpperCase("uz")}</b> XIZMATLARI`
    : "✨ <b>YAQIN XIZMATLAR</b>";
  let itemCallback = "service";
  let pageCallback = "services_page";
  let valueForItem = (service) => service.id;
  if (category) {
    const allServices = await apiRequest("/services");
    const categories = [...new Set(allServices.map((service) => service.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "uz"));
    itemCallback = "category_service";
    const categoryIndex = categories.indexOf(category);
    pageCallback = (targetPage) => `category_services_page:${categoryIndex}:${targetPage}`;
    valueForItem = (_service, index) => `${categories.indexOf(category)}:${index}`;
  }

  const keyboard = pageKeyboard(items, page, itemCallback, pageCallback, (service) => {
    const title = service.title || "Xizmat";
    const label = `${categoryIcon(service.category)} ${title}`;
    return label.length > 48 ? `${label.slice(0, 45)}...` : label;
  }, valueForItem, services.length);
  await replyOrEdit(ctx, `${heading}\nKerakli xizmatni tanlang (${services.length} ta):`, keyboard);
}

async function showCategories(ctx, page = 0) {
  const services = await apiRequest("/services");
  const categories = [...new Set(services.map((service) => service.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "uz"));
  if (!categories.length) {
    await replyOrEdit(ctx, "Hozircha kategoriyalar topilmadi.", mainKeyboard());
    return;
  }

  const start = page * pageSize;
  const items = categories.slice(start, start + pageSize);
  const keyboard = pageKeyboard(
    items,
    page,
    "category",
    "category_page",
    (name) => `${categoryIcon(name)} ${name}`,
    (_name, index) => index,
    categories.length,
  );
  await replyOrEdit(ctx, "📂 <b>XIZMAT TURINI TANLANG</b>\n\nSizga kerakli yo'nalishni tanlang 👇", keyboard);
}

async function showService(ctx, id) {
  const service = await apiRequest(`/services/${id}`);
  if (service.status !== "approved") {
    await replyOrEdit(ctx, "Bu xizmat hozircha mavjud emas.", mainKeyboard());
    return;
  }

  await apiRequest(`/services/${id}/view`, { method: "POST" });
  const price = Number(service.price) > 0 ? `${Number(service.price).toLocaleString("uz-UZ")} so'mdan` : "Narx kelishiladi";
  const text = [
    `${categoryIcon(service.category)} <b>${escapeHtml(service.title)}</b>`,
    "",
    `📂 <b>Yo'nalish:</b> ${escapeHtml(service.category)}`,
    `👨‍🔧 <b>Mutaxassis:</b> ${escapeHtml(service.provider_name)}`,
    `💸 <b>Narxi:</b> ${escapeHtml(price)}`,
    `📍 <b>Manzil:</b> ${escapeHtml(service.location)}`,
    `⭐ <b>Reyting:</b> ${escapeHtml(service.rating ?? 0)}`,
    "",
    escapeHtml(service.description.length > 420 ? `${service.description.slice(0, 417)}...` : service.description),
    "",
    `🕒 <b>Ish vaqti:</b> ${escapeHtml(service.days || "Har kuni")}, ${escapeHtml(service.time_from || "")}–${escapeHtml(service.time_to || "")}`,
    "",
    "👇 Bog'lanish yoki xaritadan ko'rish uchun tugmani bosing",
  ].join("\n");
  const keyboard = new InlineKeyboard()
    .text("📞 Bog'lanish", `call:${service.id}`)
    .text("📍 Xaritada ko'rish", `map:${service.id}`)
    .row()
    .text("⬅️ Xizmatlar", "services:0")
    .text("🏠 Bosh menyu", "menu")
    .row();
  if (miniAppEnabled) keyboard.webApp("📱 Ilovada ochish", serviceAppUrl(service.id));
  await replyWithPhoto(ctx, await servicePhoto(service.image_url), text, keyboard);
}

async function showSearchResults(ctx, search, page = 0) {
  searchQueries.set(ctx.chat.id, search);
  const services = await apiRequest(`/services?search=${encodeURIComponent(search)}`);
  const items = services.slice(page * pageSize, (page + 1) * pageSize);
  if (!items.length) {
    await replyOrEdit(ctx, `😕 “${escapeHtml(search)}” bo'yicha xizmat topilmadi.\n\nBoshqa so'z bilan qidirib ko'ring.`, mainKeyboard());
    return;
  }
  const keyboard = pageKeyboard(
    items,
    page,
    "service",
    "search_page",
    (service) => `${categoryIcon(service.category)} ${service.title || "Xizmat"}`,
    (service) => service.id,
    services.length,
  );
  await replyOrEdit(
    ctx,
    `🔎 <b>QIDIRUV NATIJALARI</b>\n\n“${escapeHtml(search)}” bo'yicha ${services.length} ta xizmat topildi. Tanlang 👇`,
    keyboard,
  );
}

bot.use(async (ctx, next) => {
  if (!ctx.callbackQuery) return next();

  const message = ctx.callbackQuery.message;
  const messageKey = message && "message_id" in message ? `${message.chat.id}:${message.message_id}` : ctx.callbackQuery.id;
  if (processingMessages.has(messageKey)) {
    await ctx.answerCallbackQuery({ text: "⏳ So'rov bajarilmoqda, biroz kuting..." });
    return;
  }

  processingMessages.add(messageKey);
  try {
    await ctx.answerCallbackQuery({ text: "⏳ Yuklanmoqda..." });
    if (message && "message_id" in message) {
      try {
        await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } });
      } catch (error) {
        console.warn("Inline tugmani vaqtincha bloklab bo'lmadi:", error);
      }
    }

    await next();
  } catch (error) {
    console.error("Inline tugma bajarilmadi:", error);
    if (message && "message_id" in message && message.reply_markup) {
      try {
        await ctx.editMessageReplyMarkup({ reply_markup: message.reply_markup });
      } catch (restoreError) {
        console.error("Inline tugmalarni qayta tiklab bo'lmadi:", restoreError);
      }
    }
    try {
      await ctx.reply("⚠️ So'rovni bajarib bo'lmadi. Iltimos, qayta urinib ko'ring.", {
        reply_markup: mainKeyboard(),
      });
    } catch (replyError) {
      console.error("Inline xato xabarini yuborib bo'lmadi:", replyError);
    }
  } finally {
    processingMessages.delete(messageKey);
  }
});

bot.command("start", async (ctx) => {
  const name = escapeHtml(ctx.from?.first_name || "do'st");
  await ctx.replyWithPhoto(
    welcomePhoto,
    {
      caption: `✨ <b>YAQIN XIZMAT</b>\n\nAssalomu alaykum, ${name}! 👋\n\n🔧 Ishonchli usta kerakmi?\n⚡ Yaqin xizmatni tez toping.\n📞 Bir bosishda bog'laning.\n\n👇 Bo'limni tanlab, xizmatlarni ko'ring!`,
      parse_mode: "HTML",
      reply_markup: mainKeyboard(),
    },
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "<b>Yaqin Xizmat botidan foydalanish</b>\n\n" +
      "/start — bosh menyu\n" +
      "/services — xizmatlarni ko'rish\n" +
      "/categories — kategoriyalar\n" +
      "/search so'z — xizmat qidirish\n\n" +
      "Chat menyusidagi <b>Open</b> tugmasi saytni Telegram Mini App'da ochadi.",
    { parse_mode: "HTML", reply_markup: mainKeyboard() },
  );
});

bot.command("services", (ctx) => showServices(ctx));
bot.command("categories", (ctx) => showCategories(ctx));
bot.command("search", async (ctx) => {
  const query = ctx.match?.trim();
  if (!query) {
    searchChats.add(ctx.chat.id);
    await ctx.reply("Qidiriladigan xizmat nomi yoki kalit so'zni yuboring:", { reply_markup: appKeyboard() });
    return;
  }
  await showSearchResults(ctx, query);
});

bot.callbackQuery("menu", async (ctx) => {
  await replyOrEdit(ctx, "✨ <b>YAQIN XIZMAT</b>\n\nQayerdan boshlaymiz? Kerakli bo'limni tanlang 👇", mainKeyboard());
});

bot.callbackQuery("services:0", async (ctx) => {
  await showServices(ctx);
});

bot.callbackQuery(/^services_page:(\d+)$/, async (ctx) => {
  await showServices(ctx, Number(ctx.match[1]));
});

bot.callbackQuery(/^categories:(\d+)$/, async (ctx) => {
  await showCategories(ctx, Number(ctx.match[1]));
});

bot.callbackQuery(/^category:(\d+)$/, async (ctx) => {
  const services = await apiRequest("/services");
  const categories = [...new Set(services.map((service) => service.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "uz"));
  const category = categories[Number(ctx.match[1])];
  if (!category) {
    await replyOrEdit(ctx, "Kategoriya topilmadi. Menyudan qayta tanlang.", mainKeyboard());
    return;
  }
  await showServices(ctx, 0, category);
});

bot.callbackQuery(/^category_page:(\d+)$/, async (ctx) => {
  await showCategories(ctx, Number(ctx.match[1]));
});

bot.callbackQuery(/^service:(\d+)$/, async (ctx) => {
  await showService(ctx, Number(ctx.match[1]));
});

bot.callbackQuery(/^category_service:(\d+):(\d+)$/, async (ctx) => {
  const allServices = await apiRequest("/services");
  const categories = [...new Set(allServices.map((service) => service.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "uz"));
  const category = categories[Number(ctx.match[1])];
  if (!category) {
    await replyOrEdit(ctx, "Kategoriya topilmadi. Menyudan qayta tanlang.", mainKeyboard());
    return;
  }
  const services = await apiRequest(`/services?category=${encodeURIComponent(category)}`);
  const service = services[Number(ctx.match[2])];
  if (!service) {
    await replyOrEdit(ctx, "Xizmat topilmadi. Ro'yxatdan qayta tanlang.", mainKeyboard());
    return;
  }
  await showService(ctx, service.id);
});

bot.callbackQuery(/^category_services_page:(\d+):(\d+)$/, async (ctx) => {
  const allServices = await apiRequest("/services");
  const categories = [...new Set(allServices.map((service) => service.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "uz"));
  const category = categories[Number(ctx.match[1])];
  if (!category) {
    await replyOrEdit(ctx, "Kategoriya topilmadi. Menyudan qayta tanlang.", mainKeyboard());
    return;
  }
  await showServices(ctx, Number(ctx.match[2]), category);
});

bot.callbackQuery(/^call:(\d+)$/, async (ctx) => {
  const service = await apiRequest(`/services/${ctx.match[1]}`);
  if (service.status !== "approved") {
    await ctx.reply("Bu xizmat hozircha mavjud emas.");
    return;
  }
  await apiRequest(`/services/${service.id}/call`, { method: "POST" });
  await ctx.reply(
    `✅ <b>${escapeHtml(service.provider_name)}</b>\n\n📞 Telefon raqami:\n<code>${escapeHtml(service.phone)}</code>\n\n🤝 Qo'ng'iroq qilib, xizmat tafsilotlarini kelishib oling.`,
    { parse_mode: "HTML", reply_markup: miniAppEnabled
      ? new InlineKeyboard().webApp("📱 Ilovada ochish", serviceAppUrl(service.id))
      : undefined },
  );
});

bot.callbackQuery(/^map:(\d+)$/, async (ctx) => {
  const service = await apiRequest(`/services/${ctx.match[1]}`);
  if (service.status !== "approved") {
    await ctx.reply("Bu xizmat hozircha mavjud emas.");
    return;
  }
  await apiRequest(`/services/${service.id}/direction`, { method: "POST" });
  const coordinates = `${encodeURIComponent(service.lat || "")},${encodeURIComponent(service.lng || "")}`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${coordinates}`;
  await ctx.reply(
    `🗺 <b>Manzil</b>\n\n📍 ${escapeHtml(service.location)}\n\nXaritada yo'lni oching 👇`,
    {
      reply_markup: miniAppEnabled
        ? new InlineKeyboard().url("🗺 Xaritada ochish", mapUrl).row().webApp("📱 Ilovada ochish", serviceAppUrl(service.id))
        : new InlineKeyboard().url("🗺 Xaritada ochish", mapUrl),
    },
  );
});

bot.callbackQuery("search", async (ctx) => {
  searchChats.add(ctx.chat.id);
  await ctx.reply("🔎 <b>Qanday xizmat kerak?</b>\n\nMasalan: santexnik, elektrik yoki dorixona. Nomini yozib yuboring 👇", {
    parse_mode: "HTML",
    reply_markup: appKeyboard(),
  });
});

bot.callbackQuery(/^search_page:(\d+)$/, async (ctx) => {
  const query = searchQueries.get(ctx.chat.id);
  if (!query) {
    await replyOrEdit(ctx, "Qidiruv sessiyasi tugadi. Yangi qidiruv boshlang.", mainKeyboard());
    return;
  }
  await showSearchResults(ctx, query, Number(ctx.match[1]));
});

bot.on("message:text", async (ctx, next) => {
  if (!searchChats.delete(ctx.chat.id) || ctx.message.text.startsWith("/")) return next();
  await showSearchResults(ctx, ctx.message.text.trim());
});

bot.catch((error) => {
  console.error("Telegram bot update error:", error.error);
});

if (miniAppEnabled) {
  await bot.api.setChatMenuButton({
    menu_button: {
      type: "web_app",
      text: "Open",
      web_app: { url: webAppUrl },
    },
  });
} else {
  console.warn("Mini App uchun HTTPS URL kerak; bot inline xizmatlar rejimida ishga tushadi.");
}
await bot.api.setMyCommands([
  { command: "start", description: "Bosh menyu" },
  { command: "services", description: "Xizmatlar ro'yxati" },
  { command: "categories", description: "Xizmat kategoriyalari" },
  { command: "search", description: "Xizmat qidirish" },
  { command: "help", description: "Yordam" },
]);

if (port) {
  const publicUrl = process.env.RENDER_EXTERNAL_URL;
  const configuredWebhookSecret = process.env.WEBHOOK_SECRET;
  if (!publicUrl || !configuredWebhookSecret) {
    throw new Error("Render webhook uchun RENDER_EXTERNAL_URL va WEBHOOK_SECRET talab qilinadi");
  }
  const webhookSecret = createHash("sha256").update(configuredWebhookSecret).digest("hex");

  await bot.init();

  const server = createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/health") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ status: "online" }));
      return;
    }

    if (request.method !== "POST" || request.url !== "/telegram-webhook") {
      response.writeHead(404);
      response.end();
      return;
    }

    const suppliedSecret = request.headers["x-telegram-bot-api-secret-token"];
    const expected = Buffer.from(webhookSecret);
    const supplied = Buffer.from(typeof suppliedSecret === "string" ? suppliedSecret : "");
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      response.writeHead(401);
      response.end();
      return;
    }

    try {
      let rawBody = "";
      for await (const chunk of request) {
        rawBody += chunk;
        if (Buffer.byteLength(rawBody) > 1_000_000) {
          response.writeHead(413);
          response.end();
          return;
        }
      }

      const update = JSON.parse(rawBody);
      await bot.handleUpdate(update);
      response.writeHead(200);
      response.end("OK");
    } catch (error) {
      console.error("Telegram webhook update failed:", error);
      if (!response.headersSent) {
        response.writeHead(400);
        response.end("Invalid webhook update");
      }
    }
  });

  await bot.api.setWebhook(`${publicUrl.replace(/\/+$/, "")}/telegram-webhook`, {
    secret_token: webhookSecret,
    allowed_updates: ["message", "callback_query"],
  });
  server.on("error", (error) => {
    console.error("Telegram webhook server failed:", error);
    process.exitCode = 1;
  });
  server.listen(port, "0.0.0.0", () => {
    console.log(`Yaqin Xizmat Telegram webhook server port ${port} da ishga tushdi.`);
  });
} else {
  console.log("Yaqin Xizmat Telegram bot polling rejimida ishga tushdi.");
  await bot.start();
}
