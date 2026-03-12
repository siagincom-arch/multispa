// Bot Multispa — Consultation Service
// Консультации по оборудованию (леса, опалубка)
// Детальные сравнения, рекомендации, помощь в выборе

const { t } = require('../../i18n');
const knowledge = require('../knowledge');
const logger = require('../utils/logger');

/**
 * Показать каталог оборудования по категории
 * @param {string} category - scaffolding | wall_formwork | slab_formwork
 * @param {string} lang - lv | ru | en
 * @returns {object[]} — массив ответов
 */
async function getEquipmentInfo(category, lang) {
    const items = await knowledge.getEquipmentByCategory(category, lang);

    if (items.length === 0) {
        logger.warn('No equipment found', { category });
        return [{
            text: t(lang, 'equipment') + '\n\n🔍 ...',
            keyboard: {
                type: 'inline',
                buttons: [
                    [{ text: t(lang, 'back'), data: 'equipment' }],
                ],
            },
        }];
    }

    const texts = items.map(item => knowledge.formatEquipmentInfo(item, lang));

    return [{
        text: texts.join('\n\n───────────────────────\n\n'),
        keyboard: {
            type: 'inline',
            buttons: [
                [{ text: t(lang, 'back'), data: 'equipment' }],
                [{ text: t(lang, 'estimate_price'), data: 'estimate_price' }],
                [{ text: t(lang, 'contact_specialist'), data: 'specialist' }],
            ],
        },
    }];
}

/**
 * Показать список категорий оборудования
 * @param {string} lang
 * @returns {object[]}
 */
function getEquipmentCategories(lang) {
    return [{
        text: t(lang, 'equipment'),
        keyboard: {
            type: 'inline',
            buttons: [
                [{ text: t(lang, 'scaffolding'), data: 'cat_scaffolding' }],
                [{ text: t(lang, 'wall_formwork'), data: 'cat_wall_formwork' }],
                [{ text: t(lang, 'slab_formwork'), data: 'cat_slab_formwork' }],
                [{ text: t(lang, 'consultation'), data: 'consultation' }],
                [{ text: t(lang, 'back'), data: 'main_menu' }],
            ],
        },
    }];
}

/**
 * Показать помощь в выборе оборудования (консультация)
 * @param {string} lang
 * @returns {object[]}
 */
function getConsultationHelp(lang) {
    return [{
        text: t(lang, 'consultation_help'),
        keyboard: {
            type: 'inline',
            buttons: [
                [{ text: t(lang, 'compare_scaffolding'), data: 'compare_scaffolding' }],
                [{ text: t(lang, 'compare_formwork'), data: 'compare_formwork' }],
                [{ text: t(lang, 'estimate_price'), data: 'estimate_price' }],
                [{ text: t(lang, 'contact_specialist'), data: 'specialist' }],
                [{ text: t(lang, 'back'), data: 'main_menu' }],
            ],
        },
    }];
}

/**
 * Сравнение типов строительных лесов (рамные vs модульные)
 * @param {string} lang
 * @returns {object[]}
 */
function getScaffoldingComparison(lang) {
    return [{
        text: t(lang, 'scaffolding_comparison'),
        keyboard: {
            type: 'inline',
            buttons: [
                [{ text: t(lang, 'estimate_price'), data: 'estimate_price' }],
                [{ text: t(lang, 'order'), data: 'order' }],
                [{ text: t(lang, 'contact_specialist'), data: 'specialist' }],
                [{ text: t(lang, 'back'), data: 'consultation' }],
            ],
        },
    }];
}

/**
 * Сравнение типов опалубки (стеновая vs перекрытий)
 * @param {string} lang
 * @returns {object[]}
 */
function getFormworkComparison(lang) {
    return [{
        text: t(lang, 'formwork_comparison'),
        keyboard: {
            type: 'inline',
            buttons: [
                [{ text: t(lang, 'estimate_price'), data: 'estimate_price' }],
                [{ text: t(lang, 'order'), data: 'order' }],
                [{ text: t(lang, 'contact_specialist'), data: 'specialist' }],
                [{ text: t(lang, 'back'), data: 'consultation' }],
            ],
        },
    }];
}

module.exports = {
    getEquipmentInfo,
    getEquipmentCategories,
    getConsultationHelp,
    getScaffoldingComparison,
    getFormworkComparison,
};
