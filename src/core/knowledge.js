// Bot Multispa — Knowledge Base Search
const Equipment = require('../db/models/equipment');
const FAQ = require('../db/models/faq');
const logger = require('./utils/logger');

/**
 * Get equipment info by category, localized
 * @param {string} category - scaffolding | wall_formwork | slab_formwork
 * @param {string} lang - lv | ru | en
 */
async function getEquipmentByCategory(category, lang = 'ru') {
    const items = await Equipment.getByCategory(category);
    return items.map(item => ({
        id: item.id,
        name: item[`name_${lang}`] || item.name_ru,
        description: item[`description_${lang}`] || item.description_ru,
        systemName: item.system_name,
        specs: item.specs,
        prices: item.prices,
    }));
}

/**
 * Get all equipment, localized
 */
async function getAllEquipment(lang = 'ru') {
    const items = await Equipment.getAll();
    return items.map(item => ({
        id: item.id,
        category: item.category,
        name: item[`name_${lang}`] || item.name_ru,
        description: item[`description_${lang}`] || item.description_ru,
        systemName: item.system_name,
    }));
}

/**
 * Get FAQ answers, localized
 */
async function getFAQ(lang = 'ru') {
    const items = await FAQ.getAll();
    return items.map(item => ({
        question: item[`question_${lang}`] || item.question_ru,
        answer: item[`answer_${lang}`] || item.answer_ru,
        category: item.category,
    }));
}

/**
 * Search FAQ by keyword
 */
async function searchFAQ(keyword, lang = 'ru') {
    const items = await FAQ.search(keyword, lang);
    return items.map(item => ({
        question: item[`question_${lang}`] || item.question_ru,
        answer: item[`answer_${lang}`] || item.answer_ru,
    }));
}

/**
 * Format equipment info for display
 */
function formatEquipmentInfo(equipment, lang = 'ru') {
    let text = `**${equipment.name}**`;
    if (equipment.systemName) {
        text += ` (${equipment.systemName})`;
    }
    text += `\n\n${equipment.description}`;

    if (equipment.prices && equipment.prices.length > 0) {
        const priceLabels = { rent: { lv: 'Noma', ru: 'Аренда', en: 'Rental' }, sale: { lv: 'Iegāde', ru: 'Покупка', en: 'Purchase' } };
        const periodLabels = { month: { lv: 'mēn.', ru: 'мес.', en: 'mo.' }, week: { lv: 'ned.', ru: 'нед.', en: 'wk.' } };

        text += '\n\n💰 ';
        equipment.prices.forEach(p => {
            const type = priceLabels[p.type]?.[lang] || p.type;
            const period = periodLabels[p.period]?.[lang] || p.period;
            const vat = p.vat_included ? '' : ' + PVN/НДС/VAT';
            text += `${type}: ${p.price_per_unit} €/${p.unit} ${vat} / ${period}`;
            if (p.notes) text += ` (${p.notes})`;
        });
    }

    return text;
}

module.exports = {
    getEquipmentByCategory,
    getAllEquipment,
    getFAQ,
    searchFAQ,
    formatEquipmentInfo,
};
