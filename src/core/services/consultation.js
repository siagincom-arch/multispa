// Bot Multispa — Consultation Service
// Консультации по оборудованию (леса, опалубка)

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
                [{ text: t(lang, 'back'), data: 'main_menu' }],
            ],
        },
    }];
}

module.exports = {
    getEquipmentInfo,
    getEquipmentCategories,
};
