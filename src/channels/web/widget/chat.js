// Bot Multispa — Chat Widget Frontend Logic
// Управление чатом: подключение Socket.io, отправка/получение сообщений

const socket = io();
let chatOpen = false;
let unreadCount = 0;

// ─── Подключение ───
socket.on('connect', () => {
    console.log('🔌 Connected to Bot Multispa');
    document.getElementById('chat-status').textContent = 'Онлайн';
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected');
    document.getElementById('chat-status').textContent = 'Переподключение...';
});

// ─── Получение сообщения от бота ───
socket.on('bot_message', (msg) => {
    appendMessage(msg);

    // Бейдж непрочитанных
    if (!chatOpen) {
        unreadCount++;
        const badge = document.getElementById('chat-badge');
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
    }
});

// ─── Открыть / закрыть чат ───
function toggleChat() {
    const window = document.getElementById('chat-window');
    const toggle = document.getElementById('chat-toggle');

    chatOpen = !chatOpen;
    window.classList.toggle('hidden', !chatOpen);

    if (chatOpen) {
        // Сбросить бейдж
        unreadCount = 0;
        document.getElementById('chat-badge').style.display = 'none';

        // Фокус на поле ввода
        setTimeout(() => {
            document.getElementById('chat-input').focus();
        }, 300);

        // Прокрутить вниз
        scrollToBottom();
    }
}

// ─── Отправить сообщение ───
function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();

    if (!text) return;

    // Показать сообщение пользователя
    appendMessage({
        text: text,
        role: 'user',
        timestamp: new Date().toISOString(),
    });

    // Отправить на сервер
    socket.emit('client_message', { text });

    // Очистить ввод
    input.value = '';
    input.focus();

    // Показать индикатор набора
    showTypingIndicator();
}

// ─── Нажатие кнопки ───
function handleButtonClick(data, buttonEl) {
    // Визуально выделить нажатую кнопку
    buttonEl.style.background = 'rgba(37, 99, 235, 0.4)';
    buttonEl.style.borderColor = '#3b82f6';

    // Отключить все кнопки в этом блоке
    const container = buttonEl.closest('.message-buttons');
    if (container) {
        container.querySelectorAll('button').forEach(btn => {
            btn.disabled = true;
            btn.style.cursor = 'default';
        });
    }

    // Отправить на сервер
    socket.emit('button_click', { data });

    // Показать индикатор набора
    showTypingIndicator();
}

// ─── Добавить сообщение в чат ───
function appendMessage(msg) {
    hideTypingIndicator();

    const container = document.getElementById('chat-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `message ${msg.role}`;

    // Пузырь с текстом
    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'message-bubble';
    bubbleEl.textContent = msg.text;
    messageEl.appendChild(bubbleEl);

    // Кнопки (если есть)
    if (msg.buttons && msg.buttons.length > 0) {
        const buttonsEl = document.createElement('div');
        buttonsEl.className = 'message-buttons';

        msg.buttons.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'btn-row';

            row.forEach(btn => {
                const btnEl = document.createElement('button');
                btnEl.textContent = btn.text;
                btnEl.onclick = () => handleButtonClick(btn.data, btnEl);
                rowEl.appendChild(btnEl);
            });

            buttonsEl.appendChild(rowEl);
        });

        messageEl.appendChild(buttonsEl);
    }

    // Время
    if (msg.timestamp) {
        const timeEl = document.createElement('div');
        timeEl.className = 'message-time';
        const time = new Date(msg.timestamp);
        timeEl.textContent = time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        messageEl.appendChild(timeEl);
    }

    container.appendChild(messageEl);
    scrollToBottom();
}

// ─── Индикатор набора ───
function showTypingIndicator() {
    hideTypingIndicator();

    const container = document.getElementById('chat-messages');
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';

    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        indicator.appendChild(dot);
    }

    container.appendChild(indicator);
    scrollToBottom();
}

function hideTypingIndicator() {
    const existing = document.getElementById('typing-indicator');
    if (existing) existing.remove();
}

// ─── Прокрутка ───
function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
    });
}
