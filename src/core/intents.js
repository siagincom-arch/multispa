// Bot Multispa — Intent Recognition
// Распознавание намерений клиента по тексту (regex, мультиязычный)
// В будущем можно заменить на OpenAI / LangChain

const logger = require('./utils/logger');

/**
 * Все поддерживаемые намерения
 */
const INTENTS = {
    PRICE_INQUIRY: 'price_inquiry',
    EQUIPMENT_INFO: 'equipment_info',
    RENTAL: 'rental',
    PURCHASE: 'purchase',
    ORDER: 'order',
    CONTACT_INFO: 'contact_info',
    WORKING_HOURS: 'working_hours',
    FAQ: 'faq',
    DELIVERY: 'delivery',
    SPECIALIST: 'specialist',
    GREETING: 'greeting',
    FAREWELL: 'farewell',
    THANKS: 'thanks',
    UNKNOWN: 'unknown',
};

/**
 * Паттерны для распознавания намерений (RU / LV / EN)
 */
const intentPatterns = [
    {
        intent: INTENTS.GREETING,
        patterns: [
            /^(привет|здравствуй|добрый\s*(день|вечер|утро)|хай|салют)/i,
            /^(sveiki|labdien|labvakar|labrit|čau)/i,
            /^(hello|hi|hey|good\s*(morning|evening|day)|greetings)/i,
        ],
    },
    {
        intent: INTENTS.FAREWELL,
        patterns: [
            /^(пока|до\s*свидания|прощай|всего\s*доброго)/i,
            /^(atā|uz\s*redzēšanos|visu\s*labu|ardievu)/i,
            /^(bye|goodbye|see\s*you|take\s*care)/i,
        ],
    },
    {
        intent: INTENTS.THANKS,
        patterns: [
            /(спасибо|благодар)/i,
            /(paldies|pateicī)/i,
            /(thank|thanks)/i,
        ],
    },
    {
        intent: INTENTS.PRICE_INQUIRY,
        patterns: [
            /(цен|стоимост|сколько\s*стоит|прайс|тариф|расценк)/i,
            /(cen|izmaks|cik\s*maksā|tarif)/i,
            /(price|cost|how\s*much|tariff|rate)/i,
        ],
    },
    {
        intent: INTENTS.EQUIPMENT_INFO,
        patterns: [
            /(оборудован|леса|опалуб|scaffold|формворк|строительн)/i,
            /(iekārt|sastatn|veidņ|celtniec)/i,
            /(equipment|scaffold|formwork|construction)/i,
        ],
    },
    {
        intent: INTENTS.RENTAL,
        patterns: [
            /(аренд|сдать|снять|напрокат|прокат)/i,
            /(nom|īr)/i,
            /(rent|lease|hire)/i,
        ],
    },
    {
        intent: INTENTS.PURCHASE,
        patterns: [
            /(купить|покупк|приобрест|продаж)/i,
            /(pirkt|iegād|pārdošan)/i,
            /(buy|purchase|sell)/i,
        ],
    },
    {
        intent: INTENTS.CONTACT_INFO,
        patterns: [
            /(контакт|телефон|позвонить|связ|email|почт)/i,
            /(kontakt|tālrun|zvani|sazināt)/i,
            /(contact|phone|call|email|reach)/i,
        ],
    },
    {
        intent: INTENTS.WORKING_HOURS,
        patterns: [
            /(время\s*работ|график|расписан|часы\s*работ|когда\s*работ)/i,
            /(darba\s*laik|grafik|kad\s*strādā)/i,
            /(work.*hour|schedule|opening.*time|when.*open)/i,
        ],
    },
    {
        intent: INTENTS.FAQ,
        patterns: [
            /(faq|вопрос|частые|помощь|помоги)/i,
            /(jautāj|bieži|palīdz)/i,
            /(faq|question|help|frequently)/i,
        ],
    },
    {
        intent: INTENTS.DELIVERY,
        patterns: [
            /(доставк|привез|привоз)/i,
            /(piegād|atvest)/i,
            /(deliver|transport|bring)/i,
        ],
    },
    {
        intent: INTENTS.SPECIALIST,
        patterns: [
            /(специалист|менеджер|консультант|инженер)/i,
            /(speciālist|menedžeri|konsultant)/i,
            /(specialist|manager|consultant|engineer)/i,
        ],
    },
];

/**
 * Распознать намерение из текста
 * @param {string} text — текст сообщения клиента
 * @returns {{ intent: string, confidence: number }}
 */
function recognizeIntent(text) {
    if (!text || typeof text !== 'string') {
        return { intent: INTENTS.UNKNOWN, confidence: 0 };
    }

    const lower = text.toLowerCase().trim();

    for (const { intent, patterns } of intentPatterns) {
        for (const pattern of patterns) {
            if (pattern.test(lower)) {
                logger.debug('Intent recognized', { intent, text: text.substring(0, 50) });
                return { intent, confidence: 0.8 };
            }
        }
    }

    return { intent: INTENTS.UNKNOWN, confidence: 0 };
}

/**
 * Маппинг intent → callback action для engine.js
 */
function intentToAction(intent) {
    const mapping = {
        [INTENTS.PRICE_INQUIRY]: 'prices',
        [INTENTS.EQUIPMENT_INFO]: 'equipment',
        [INTENTS.RENTAL]: 'order',
        [INTENTS.PURCHASE]: 'order',
        [INTENTS.ORDER]: 'order',
        [INTENTS.CONTACT_INFO]: 'contacts',
        [INTENTS.WORKING_HOURS]: 'working_hours',
        [INTENTS.FAQ]: 'faq',
        [INTENTS.DELIVERY]: 'delivery',
        [INTENTS.SPECIALIST]: 'specialist',
    };
    return mapping[intent] || null;
}

module.exports = {
    INTENTS,
    recognizeIntent,
    intentToAction,
};
