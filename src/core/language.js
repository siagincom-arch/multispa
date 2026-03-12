// Bot Multispa — Language Detection & Management
const { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } = require('../i18n');
const logger = require('./utils/logger');

// In-memory language store (per user)
const userLanguages = new Map();

// Cleanup expired language entries (24h TTL, checked hourly)
const LANG_TTL = 24 * 60 * 60 * 1000;
const langCleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [userId, entry] of userLanguages) {
        if (now - entry.updatedAt > LANG_TTL) {
            userLanguages.delete(userId);
        }
    }
}, 60 * 60 * 1000);
if (langCleanupTimer.unref) langCleanupTimer.unref();

// Частые слова для определения языка (score-boost)
const COMMON_WORDS = {
    lv: [
        'sveiki', 'labdien', 'lūdzu', 'paldies', 'jā', 'nē', 'man', 'vajag',
        'vēlos', 'cik', 'kur', 'kad', 'kā', 'vai', 'es', 'mēs', 'jūs',
        'sastatnes', 'veidņi', 'noma', 'cena', 'piegāde', 'darba',
    ],
    ru: [
        'привет', 'здравствуйте', 'пожалуйста', 'спасибо', 'да', 'нет',
        'мне', 'нужно', 'хочу', 'сколько', 'где', 'когда', 'как', 'можно',
        'аренда', 'леса', 'опалубка', 'цена', 'доставка', 'заказать',
        'подскажите', 'помогите', 'добрый', 'день', 'вечер',
    ],
    en: [
        'hello', 'please', 'thank', 'thanks', 'yes', 'need', 'want',
        'how', 'much', 'where', 'when', 'can', 'the', 'scaffolding',
        'formwork', 'rent', 'price', 'delivery', 'order', 'would', 'like',
    ],
};

/**
 * Detect language from text input
 * Uses proportional character analysis + common word matching
 * Returns null if confidence is too low (caller should keep current language)
 */
function detectLanguage(text) {
    if (!text) return null;

    const lower = text.toLowerCase().trim();

    // 0. Слишком короткий текст без букв — не определяем
    if (lower.length < 2) return null;

    // 1. Явный выбор языка (кнопки, слова-маркеры)
    if (/^(latviešu|latvian|🇱🇻|lv)$/i.test(lower)) return 'lv';
    if (/^(русский|russian|🇷🇺|ru)$/i.test(lower)) return 'ru';
    if (/^(english|английский|angļu|🇬🇧|en)$/i.test(lower)) return 'en';

    // 2. Подсчёт символов по группам
    const lvChars = (lower.match(/[āčēģīķļņšūž]/gi) || []).length;
    const cyrillic = (lower.match(/[а-яёА-ЯЁ]/g) || []).length;
    const latin = (lower.match(/[a-zA-Z]/g) || []).length;
    const totalLetters = lvChars + cyrillic + latin;

    // Если нет ни одной буквы (только цифры, эмодзи, знаки) — не определяем
    if (totalLetters === 0) return null;

    // 3. Подсчёт совпадений с частыми словами
    // Очистка слов от пунктуации для лучшего совпадения
    const words = lower.split(/[\s,.:;!?]+/).filter(w => w.length > 0);
    const scores = { lv: 0, ru: 0, en: 0 };
    let lvWordHits = 0;
    let ruWordHits = 0;
    let enWordHits = 0;

    // Очки за частые слова (каждое совпадение = 10 баллов — высокий приоритет)
    for (const word of words) {
        if (COMMON_WORDS.lv.includes(word)) { scores.lv += 10; lvWordHits++; }
        if (COMMON_WORDS.ru.includes(word)) { scores.ru += 10; ruWordHits++; }
        if (COMMON_WORDS.en.includes(word)) { scores.en += 10; enWordHits++; }
    }

    // Очки за символы
    if (lvChars > 0) scores.lv += lvChars * 3;      // Латышские диакритики — сильный сигнал
    if (cyrillic > 0) scores.ru += cyrillic * 2;     // Кириллица — сильный сигнал

    // Латиница считается за EN только если нет кириллицы и нет LV common words
    // Это предотвращает ошибочное определение EN при наличии email/URL в русском тексте
    // или латышского текста без диакритик
    if (latin > 0 && cyrillic === 0 && lvWordHits === 0) {
        scores.en += latin;
    }

    // 4. Определить победителя
    const maxScore = Math.max(scores.lv, scores.ru, scores.en);

    // Если максимальный score слишком мал — не навязываем язык
    if (maxScore < 2) return null;

    // Проверить, есть ли явный лидер
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [bestLang, bestScore] = sorted[0];
    const [, secondScore] = sorted[1];

    // Если разница слишком мала — не уверены
    if (bestScore > 0 && secondScore > 0 && (bestScore - secondScore) / bestScore < 0.15) {
        return null; // Нет уверенности — сохранить текущий язык
    }

    return bestLang;
}

/**
 * Get user's preferred language
 */
function getUserLanguage(userId) {
    const entry = userLanguages.get(userId);
    return entry ? entry.lang : null;
}

/**
 * Set user's preferred language
 */
function setUserLanguage(userId, lang) {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
        userLanguages.set(userId, { lang, updatedAt: Date.now() });
        logger.debug('Language set', { userId, lang });
    }
}

/**
 * Check if user has selected a language
 */
function hasLanguage(userId) {
    return userLanguages.has(userId);
}

module.exports = {
    detectLanguage,
    getUserLanguage,
    setUserLanguage,
    hasLanguage,
};
