// Bot Multispa — Contacts Service
// Контактная информация, сбор контактов клиента, перенаправление на специалистов

const { t } = require('../../i18n');
const { setState, getAllData, STATES } = require('../dialog');
const Clients = require('../../db/models/clients');
const Inquiries = require('../../db/models/inquiries');
const logger = require('../utils/logger');

/**
 * Показать контактную информацию компании
 * @param {string} lang
 * @returns {object[]}
 */
function getCompanyContacts(lang) {
    return [{
        text: t(lang, 'contacts_info'),
        keyboard: {
            type: 'inline',
            buttons: [
                [{ text: t(lang, 'back'), data: 'main_menu' }],
            ],
        },
    }];
}

/**
 * Показать время работы
 * @param {string} lang
 * @returns {object[]}
 */
function getWorkingHours(lang) {
    return [{
        text: t(lang, 'working_hours_info'),
        keyboard: {
            type: 'inline',
            buttons: [
                [{ text: t(lang, 'back'), data: 'main_menu' }],
            ],
        },
    }];
}

/**
 * Перенаправление на специалиста
 * @param {string} lang
 * @returns {object[]}
 */
function redirectToSpecialist(lang) {
    return [{
        text: t(lang, 'specialist_redirect'),
        keyboard: {
            type: 'inline',
            buttons: [
                [{ text: t(lang, 'back'), data: 'main_menu' }],
            ],
        },
    }];
}

/**
 * Обработка ввода контактных данных клиента
 * @param {string} userId
 * @param {string} text — текст с телефоном или email
 * @param {string} lang
 * @param {string} channel
 * @returns {object[]}
 */
async function handleContactInput(userId, text, lang, channel) {
    const client = await Clients.findOrCreate(userId, channel);

    // Извлечь email и/или телефон
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = text.match(/[+]?[\d\s\-()]{7,}/);

    if (emailMatch || phoneMatch) {
        const updates = {};
        if (emailMatch) updates.email = emailMatch[0];
        if (phoneMatch) updates.phone = phoneMatch[0].trim();

        if (client) {
            await Clients.updateContacts(client.id, updates);

            // Создать заявку из собранных данных
            const sessionData = getAllData(userId);
            await Inquiries.create({
                client_id: client.id,
                type: sessionData.type || null,
                equipment_category: sessionData.equipment_category || null,
                has_drawings: sessionData.has_drawings || false,
                duration: sessionData.duration || null,
                status: 'new',
            });

            logger.info('Contact info saved, inquiry created', {
                userId,
                email: updates.email,
                phone: updates.phone,
            });
        }

        setState(userId, STATES.FAREWELL);
        return [{
            text: t(lang, 'thank_contacts'),
        }, {
            text: t(lang, 'farewell'),
            keyboard: {
                type: 'inline',
                buttons: [
                    [{ text: '🔄 ' + t(lang, 'main_menu'), data: 'main_menu' }],
                ],
            },
        }];
    }

    // Контактные данные не распознаны — спросить ещё раз
    return [{
        text: t(lang, 'ask_contacts'),
    }];
}

/**
 * Запросить контактные данные
 * @param {string} userId
 * @param {string} lang
 * @returns {object[]}
 */
function askForContacts(userId, lang) {
    setState(userId, STATES.CONTACTS);
    return [{
        text: t(lang, 'delivery_info'),
    }, {
        text: t(lang, 'ask_contacts'),
    }];
}

module.exports = {
    getCompanyContacts,
    getWorkingHours,
    redirectToSpecialist,
    handleContactInput,
    askForContacts,
};
