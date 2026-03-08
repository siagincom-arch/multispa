// Bot Multispa — Documents Service
// Приём и обработка документов (чертежи, проекты)

const { t } = require('../../i18n');
const { setData, setState, STATES } = require('../dialog');
const logger = require('../utils/logger');

/**
 * Запросить загрузку файла (чертёж / проект)
 * @param {string} userId
 * @param {string} lang
 * @returns {object[]}
 */
function requestFileUpload(userId, lang) {
    setState(userId, STATES.AWAITING_FILE);
    return [{
        text: t(lang, 'upload_drawing') + '\n📎',
    }];
}

/**
 * Обработать полученный файл
 * @param {string} userId
 * @param {object[]} files — массив файлов
 * @param {string} lang
 * @returns {object[]}
 */
function handleFileReceived(userId, files, lang) {
    setData(userId, 'has_drawings', true);
    setState(userId, STATES.DELIVERY);

    logger.info('File received from client', {
        userId,
        fileCount: files.length,
    });

    return [{
        text: t(lang, 'file_received'),
    }, {
        text: t(lang, 'delivery_info'),
        keyboard: {
            type: 'inline',
            buttons: [
                [{ text: t(lang, 'contact_specialist'), data: 'delivery' }],
                [{ text: t(lang, 'back'), data: 'main_menu' }],
            ],
        },
    }];
}

module.exports = {
    requestFileUpload,
    handleFileReceived,
};
