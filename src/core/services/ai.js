// Bot Multispa — AI Service (OpenAI Integration)
// Все текстовые сообщения обрабатываются через AI

const OpenAI = require('openai');
const config = require('../../config');
const knowledge = require('../knowledge');
const logger = require('../utils/logger');

let openai = null;

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

ЦЕНЫ АРЕНДЫ (ориентировочные, + ПВН):
- Модульные леса: 2,20 €/м² стены / мес.
- Фасадные (рамные) леса: 1,40 €/м² стены / мес.
- Опалубка стен PIONBOX MINI (h=120 см): 6,00 €/м² / нед.
- Опалубка перекрытий RINGER: 3,00 €/м² / нед.
Всегда уточняй, что это ориентировочные цены и окончательную стоимость предоставит сотрудник.

${equipmentContext ? `ОБОРУДОВАНИЕ:\n${equipmentContext}\n` : ''}
${faqContext ? `ЧАСТЫЕ ВОПРОСЫ:\n${faqContext}\n` : ''}
Если клиент спрашивает что-то, на что можешь дать расчёт — посчитай (площадь × тариф) и покажи результат.`;
}

/**
 * Generate AI response
 * @param {string} text — user message
 * @param {string} lang — language code (ru/lv/en)
 * @param {string} [mode] — optional mode: 'greet' for welcome message
 * @returns {string|null}
 */
async function generateResponse(text, lang, mode) {
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

        const completion = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            max_tokens: 500,
            temperature: 0.7,
        });

        const response = completion.choices[0]?.message?.content?.trim();
        if (!response) {
            logger.warn('AI: empty response from OpenAI');
            return null;
        }

        logger.info('AI: generated response', { textLen: text.length, responseLen: response.length, mode });
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
};
