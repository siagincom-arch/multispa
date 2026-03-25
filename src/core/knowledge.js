// Bot Multispa — Knowledge Base Search
const Equipment = require('../db/models/equipment');
const FAQ = require('../db/models/faq');
const logger = require('./utils/logger');

/**
 * Corrections for equipment descriptions that can't be updated in DB due to RLS.
 * Key = system_name, value = { description_ru, description_lv, description_en, specs }
 */
const DESCRIPTION_OVERRIDES = {
    'PIONBOX MINI': {
        description_ru: 'Система PIONBOX MINI состоит из панелей высотой 120 см и шириной 20, 25, 30, 35, 45, 60, 70 и 90 см. Самая большая панель (90×120 см) весит всего 45 кг.',
        description_lv: 'PIONBOX MINI sistēma sastāv no paneļiem ar augstumu 120 cm un platumu 20, 25, 30, 35, 45, 60, 70 un 90 cm. Lielākais panelis (90×120 cm) sver tikai 45 kg.',
        description_en: 'The PIONBOX MINI system consists of panels with a height of 120 cm and widths of 20, 25, 30, 35, 45, 60, 70 and 90 cm. The largest panel (90×120 cm) weighs only 45 kg.',
        specs: {
            panel_widths_cm: [20, 25, 30, 35, 45, 60, 70, 90],
            panel_heights_cm: [120],
            frame_thickness_mm: 5,
            max_panel_weight_kg: 45,
            plywood_thickness_mm: 12,
        },
    },
};

/**
 * Get equipment info by category, localized
 * @param {string} category - scaffolding | wall_formwork | slab_formwork
 * @param {string} lang - lv | ru | en
 */
async function getEquipmentByCategory(category, lang = 'ru') {
    const items = await Equipment.getByCategory(category);
    return items.map(item => {
        const override = DESCRIPTION_OVERRIDES[item.system_name];
        return {
            id: item.id,
            name: item[`name_${lang}`] || item.name_ru,
            description: override?.[`description_${lang}`] || item[`description_${lang}`] || item.description_ru,
            systemName: item.system_name,
            specs: override?.specs || item.specs,
            prices: item.prices,
        };
    });
}

/**
 * Get all equipment, localized
 */
async function getAllEquipment(lang = 'ru') {
    const items = await Equipment.getAll();
    return items.map(item => {
        const override = DESCRIPTION_OVERRIDES[item.system_name];
        return {
            id: item.id,
            category: item.category,
            name: item[`name_${lang}`] || item.name_ru,
            description: override?.[`description_${lang}`] || item[`description_${lang}`] || item.description_ru,
            systemName: item.system_name,
        };
    });
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
            const vat = p.vat_included ? '' : ' + PVN/НДС/VAT 21%';
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
