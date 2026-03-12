// Bot Multispa — Web Channel (Express + Socket.io)
// HTTP-сервер + WebSocket для чат-виджета на сайте

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const config = require('../../config');
const logger = require('../../core/utils/logger');
const { processMessage, handleStart } = require('../../core/engine');
const { toEngineFormat, toWebFormat } = require('./adapter');

/**
 * Создать и запустить веб-сервер
 */
function createWebServer() {
    const app = express();
    const httpServer = createServer(app);

    // Socket.io с CORS — только разрешённые домены
    const allowedOrigins = [
        'https://betonaveidni.lv',
        'https://www.betonaveidni.lv',
    ];
    if (config.app.env === 'development') {
        allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
    }

    const io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
        },
    });

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Статические файлы виджета
    app.use('/widget', express.static(path.join(__dirname, 'widget')));

    // Health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', service: 'Bot Multispa Web', timestamp: new Date().toISOString() });
    });

    // Socket.io — обработка подключений
    io.on('connection', (socket) => {
        const clientId = socket.id;
        logger.info('Web client connected', { clientId });

        // Отправить приветствие при подключении
        (async () => {
            try {
                const responses = await handleStart(`web_${clientId}`, 'web');
                const webMessages = toWebFormat(responses);
                webMessages.forEach(msg => socket.emit('bot_message', msg));
            } catch (err) {
                logger.error('Error sending welcome', { error: err.message });
            }
        })();

        // Получение сообщения от клиента
        socket.on('client_message', async (data) => {
            logger.debug('Web message received', { clientId, text: data.text?.substring(0, 50) });

            try {
                const engineMsg = toEngineFormat({ ...data, clientId });
                const responses = await processMessage(engineMsg);
                const webMessages = toWebFormat(responses);
                webMessages.forEach(msg => socket.emit('bot_message', msg));
            } catch (err) {
                logger.error('Error processing web message', { error: err.message, clientId });
                socket.emit('bot_message', {
                    id: Date.now().toString(36),
                    text: '⚠️ Произошла ошибка. Попробуйте ещё раз.',
                    role: 'bot',
                    timestamp: new Date().toISOString(),
                });
            }
        });

        // Нажатие кнопки
        socket.on('button_click', async (data) => {
            logger.debug('Web button click', { clientId, data: data.data });

            try {
                const engineMsg = toEngineFormat({ callbackData: data.data, clientId });
                const responses = await processMessage(engineMsg);
                const webMessages = toWebFormat(responses);
                webMessages.forEach(msg => socket.emit('bot_message', msg));
            } catch (err) {
                logger.error('Error processing button click', { error: err.message, clientId });
            }
        });

        // Отключение
        socket.on('disconnect', () => {
            logger.info('Web client disconnected', { clientId });
        });
    });

    // Запуск сервера
    const port = config.app.port || 3000;
    httpServer.listen(port, () => {
        logger.info(`🌐 Web widget server running on http://localhost:${port}`);
        logger.info(`📦 Widget available at http://localhost:${port}/widget/`);
    });

    return { app, httpServer, io };
}

module.exports = { createWebServer };
