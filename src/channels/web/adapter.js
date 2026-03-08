// Bot Multispa — Web Channel Adapter
// Адаптер: преобразование веб-формата ↔ внутренний формат движка

const logger = require('../../core/utils/logger');

/**
 * Преобразовать входящее веб-сообщение в формат движка
 * @param {object} data — { text, clientId, files }
 * @returns {object} — { text, userId, channel, files, callbackData }
 */
function toEngineFormat(data) {
    return {
        text: data.text || null,
        userId: `web_${data.clientId}`,
        channel: 'web',
        files: data.files || null,
        callbackData: data.callbackData || null,
    };
}

/**
 * Преобразовать ответ движка в формат для веб-клиента
 * @param {object[]} responses — массив ответов движка [{ text, keyboard }]
 * @returns {object[]} — массив для отправки через Socket.io
 */
function toWebFormat(responses) {
    return responses.map(resp => {
        const msg = {
            id: generateId(),
            text: resp.text || '',
            role: 'bot',
            timestamp: new Date().toISOString(),
        };

        // Преобразовать inline-кнопки в веб-формат
        if (resp.keyboard && resp.keyboard.buttons) {
            msg.buttons = resp.keyboard.buttons.map(row =>
                row.map(btn => ({
                    text: btn.text,
                    data: btn.data,
                }))
            );
        }

        return msg;
    });
}

/**
 * Генерировать уникальный ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

module.exports = {
    toEngineFormat,
    toWebFormat,
    generateId,
};
