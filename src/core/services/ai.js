// Bot Multispa — AI Service (OpenAI Integration)
// Все текстовые сообщения обрабатываются через AI
// История диалога хранится in-memory для передачи контекста в OpenAI

const OpenAI = require('openai');
const config = require('../../config');
const knowledge = require('../knowledge');
const logger = require('../utils/logger');

let openai = null;

// --- Память диалога: хранит последние сообщения для каждого пользователя ---
const MAX_HISTORY = 20; // макс. сообщений в контексте (10 пар user/assistant)
const HISTORY_TTL = 2 * 60 * 60 * 1000; // 2 часа TTL
const conversationHistory = new Map();

/**
 * Получить историю диалога для пользователя
 */
function getHistory(userId) {
    const entry = conversationHistory.get(userId);
    if (!entry) return [];
    // Проверка TTL
    if (Date.now() - entry.lastActivity > HISTORY_TTL) {
        conversationHistory.delete(userId);
        return [];
    }
    entry.lastActivity = Date.now();
    return entry.messages;
}

/**
 * Добавить сообщение в историю
 */
function addToHistory(userId, role, content) {
    let entry = conversationHistory.get(userId);
    if (!entry) {
        entry = { messages: [], lastActivity: Date.now() };
        conversationHistory.set(userId, entry);
    }
    entry.lastActivity = Date.now();
    entry.messages.push({ role, content });
    // Обрезаем до MAX_HISTORY (удаляем самые старые)
    if (entry.messages.length > MAX_HISTORY) {
        entry.messages = entry.messages.slice(-MAX_HISTORY);
    }
}

/**
 * Очистить историю пользователя (при /start)
 */
function clearHistory(userId) {
    conversationHistory.delete(userId);
}

// Периодическая очистка устаревших сессий
const historyCleanupTimer = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [userId, entry] of conversationHistory) {
        if (now - entry.lastActivity > HISTORY_TTL) {
            conversationHistory.delete(userId);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        logger.debug('AI history cleanup', { cleaned, remaining: conversationHistory.size });
    }
}, 60 * 60 * 1000);
if (historyCleanupTimer.unref) historyCleanupTimer.unref();

/**
 * Lazy-init OpenAI client
 */
function getClient() {
    if (!openai) {
        if (!config.openai.apiKey) {
            return null;
        }
        openai = new OpenAI({ apiKey: config.openai.apiKey });
    }
    return openai;
}

const LANG_NAMES = { ru: 'русский', lv: 'latviešu', en: 'English' };

/**
 * Build system prompt with company context
 */
async function buildSystemPrompt(lang) {
    let equipmentContext = '';
    let faqContext = '';

    try {
        const equipment = await knowledge.getAllEquipment(lang);
        if (equipment.length > 0) {
            equipmentContext = equipment.map(e =>
                `- ${e.name} (${e.category}): ${e.description || ''}`
            ).join('\n');
        }
    } catch (err) {
        logger.warn('AI: failed to load equipment for context', { error: err.message });
    }

    try {
        const faq = await knowledge.getFAQ(lang);
        if (faq.length > 0) {
            faqContext = faq.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
        }
    } catch (err) {
        logger.warn('AI: failed to load FAQ for context', { error: err.message });
    }

    return `Ты — виртуальный ассистент компании SIA «MULTISPA» (сайт: betonaveidni.lv).
Компания занимается арендой и продажей строительных лесов и опалубки в Латвии.

ПРАВИЛА:
- Отвечай на языке: ${LANG_NAMES[lang] || 'русский'}
- Будь вежливым, профессиональным, кратким (2-4 предложения)
- Ты ведёшь живой диалог, как реальный консультант — без кнопок и меню
- Отвечай на вопросы о строительных лесах, опалубке, аренде, покупке, ценах, доставке
- На вопросы не по теме — вежливо перенаправь к тематике компании
- НЕ выдумывай информацию, которой нет в контексте ниже
- Если точной информации нет — предложи связаться со специалистом по телефону или email
- Если клиент хочет заказать — попроси контактные данные (имя, телефон или email)
- Если клиент присылает приветствие — поздоровайся и коротко расскажи чем можешь помочь
- Используй emoji умеренно (1-2 на сообщение)

КОНТАКТЫ КОМПАНИИ:
📞 +371 270 66 380, +371 292 46 838
📧 siamultispa@gmail.com
🌐 betonaveidni.lv
⏰ Пн–Пт 9:00–18:00
⚠️ Визиты только по предварительной договорённости

ЦЕНЫ АРЕНДЫ (ориентировочные, + PVN 21%):
- Модульные леса: 2,20 €/м² стены / мес. + PVN 21%
- Фасадные (рамные) леса: 1,40 €/м² стены / мес. + PVN 21%
- Опалубка стен PIONBOX MINI: 6,00 €/м² опалубки / нед. + PVN 21%
- Опалубка перекрытий RINGER: 3,00 €/м² / нед. + PVN 21%
Всегда указывай "+ PVN 21%" рядом с любой ценой.

ФОРМУЛЫ РАСЧЁТА ПЛОЩАДЕЙ — ОБЯЗАТЕЛЬНО ИСПОЛЬЗУЙ ПРИ РАСЧЁТАХ:

1) ЛЕСА (модульные и рамные):
   Площадь = сумма площадей всех стен, где площадь стены = длина × высота.
   Спроси клиента: «Какие размеры стен (длина и высота каждой стены)?»
   Если клиент даёт периметр и высоту: площадь = периметр × высота.
   Пример: стены 12×4 + 8×4 + 12×4 + 8×4 = 48+32+48+32 = 160 м²
   Стоимость = 160 × ставка = итого €/мес. + PVN 21%

2) ОПАЛУБКА СТЕН (PIONBOX MINI):
   ⚠️ ВАЖНО: Высота панелей PIONBOX MINI ФИКСИРОВАННАЯ — 1,20 м. Другой высоты нет!
   ⚠️ ВАЖНО: Опалубка ставится С ДВУХ СТОРОН стены, поэтому умножаем на 2.
   Площадь = сумма длин всех стен × 2 (две стороны) × 1,20 м (высота панели)
   Спроси клиента: «Какова общая длина стен для заливки (или периметр)?»
   Пример: стены 10+8+10+8 = 36 м → 36 × 2 × 1,20 = 86,4 м²
   Стоимость = 86,4 × 6,00 = 518,40 €/нед. + PVN 21%
   Всегда напоминай клиенту: «Опалубка PIONBOX MINI имеет фиксированную высоту 1,20 м».

3) ОПАЛУБКА ПЕРЕКРЫТИЙ (RINGER):
   Площадь = сумма площадей всех помещений/плит, где площадь = длина × ширина.
   Спроси клиента: «Какие размеры перекрытия (длина и ширина каждого помещения)?»
   Пример: комната 6×4=24 + комната 5×3=15 = 39 м²
   Стоимость = 39 × 3,00 = 117 €/нед. + PVN 21%

ПРАВИЛА РАСЧЁТА:
- Всегда спрашивай: «Есть ещё стены/помещения для расчёта?»
- Показывай пошаговый расчёт: сначала площадь каждой стены/помещения, потом сумму, потом стоимость
- Округляй итого до 2 знаков после запятой
- Уточняй, что это ориентировочные цены и окончательную стоимость предоставит сотрудник

${equipmentContext ? `ОБОРУДОВАНИЕ:\n${equipmentContext}\n` : ''}
${faqContext ? `ЧАСТЫЕ ВОПРОСЫ:\n${faqContext}\n` : ''}
Если клиент спрашивает что-то, на что можешь дать расчёт — используй формулы выше и покажи пошаговый результат.`;
}

/**
 * Generate AI response with conversation history
 * @param {string} text — user message
 * @param {string} lang — language code (ru/lv/en)
 * @param {string} [mode] — optional mode: 'greet' for welcome message
 * @param {string} [userId] — ID пользователя для хранения истории
 * @returns {string|null}
 */
async function generateResponse(text, lang, mode, userId) {
    const client = getClient();
    if (!client) {
        logger.debug('AI: OpenAI not configured, skipping');
        return null;
    }

    try {
        const systemPrompt = await buildSystemPrompt(lang);

        const userMessage = mode === 'greet'
            ? `Клиент только что выбрал язык общения (${LANG_NAMES[lang]}). Поприветствуй его кратко и скажи чем можешь помочь (аренда/покупка лесов и опалубки, цены, консультация). 2-3 предложения.`
            : text;

        // Собираем массив сообщений: system + история + текущее
        const messages = [{ role: 'system', content: systemPrompt }];

        // Добавляем историю диалога (если есть userId)
        if (userId && mode !== 'greet') {
            const history = getHistory(userId);
            messages.push(...history);
        }

        // Текущее сообщение пользователя
        messages.push({ role: 'user', content: userMessage });

        const completion = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            max_tokens: 500,
            temperature: 0.7,
        });

        const response = completion.choices[0]?.message?.content?.trim();
        if (!response) {
            logger.warn('AI: empty response from OpenAI');
            return null;
        }

        // Сохраняем в историю (и запрос, и ответ)
        if (userId && mode !== 'greet') {
            addToHistory(userId, 'user', userMessage);
            addToHistory(userId, 'assistant', response);
        }

        logger.info('AI: generated response', {
            textLen: text.length,
            responseLen: response.length,
            mode,
            historyLen: userId ? getHistory(userId).length : 0,
        });
        return response;
    } catch (err) {
        logger.error('AI: OpenAI request failed', { error: err.message });
        return null;
    }
}

/**
 * Check if AI is available
 */
function isAvailable() {
    return !!config.openai.apiKey;
}

module.exports = {
    generateResponse,
    isAvailable,
    clearHistory,
};
