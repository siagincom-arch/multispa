// Tests — Engine (engine.js)
// Тестируем обработку сообщений: handleStart, processMessage
// Используем моки для Supabase моделей

// Мокаем Supabase и логгер до подключения модулей
jest.mock('../../src/db/supabase', () => ({}));
jest.mock('../../src/core/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
}));

jest.mock('../../src/db/models/clients', () => ({
    findOrCreate: jest.fn().mockResolvedValue({ id: 'client-uuid-1', telegram_id: 123 }),
    updateLanguage: jest.fn().mockResolvedValue(undefined),
    updateContacts: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/db/models/inquiries', () => ({
    create: jest.fn().mockResolvedValue({ id: 'inquiry-uuid-1' }),
}));

jest.mock('../../src/db/models/dialog_logs', () => ({
    log: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/db/models/equipment', () => ({
    getAll: jest.fn().mockResolvedValue([]),
    getByCategory: jest.fn().mockResolvedValue([]),
    getById: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../src/db/models/faq', () => ({
    getAll: jest.fn().mockResolvedValue([]),
    getByCategory: jest.fn().mockResolvedValue([]),
    search: jest.fn().mockResolvedValue([]),
}));

const { processMessage, handleStart } = require('../../src/core/engine');
const { resetSession, getState, STATES } = require('../../src/core/dialog');

describe('Engine — processMessage', () => {
    const testUserId = 'engine-test-user';

    beforeEach(() => {
        resetSession(testUserId);
        jest.clearAllMocks();
    });

    describe('handleStart()', () => {
        test('возвращает приветствие с выбором языка', async () => {
            const responses = await handleStart(testUserId, 'telegram');

            expect(responses).toHaveLength(1);
            expect(responses[0].text).toContain('MULTISPA');
            expect(responses[0].keyboard).toBeDefined();
            expect(responses[0].keyboard.type).toBe('inline');
            expect(responses[0].keyboard.buttons).toHaveLength(3); // LV, RU, EN
        });

        test('сбрасывает сессию при старте', async () => {
            const { setState } = require('../../src/core/dialog');
            setState(testUserId, STATES.FAREWELL);

            await handleStart(testUserId, 'telegram');

            expect(getState(testUserId)).toBe(STATES.WELCOME);
        });
    });

    describe('processMessage() — callback языка', () => {
        test('выбор русского языка через callback', async () => {
            const responses = await processMessage({
                userId: testUserId,
                callbackData: 'lang_ru',
                channel: 'telegram',
            });

            expect(responses.length).toBeGreaterThanOrEqual(1);
            // После выбора языка должно быть главное меню
            const menuResponse = responses.find(r => r.keyboard);
            expect(menuResponse).toBeDefined();
        });

        test('выбор латышского языка через callback', async () => {
            const responses = await processMessage({
                userId: testUserId,
                callbackData: 'lang_lv',
                channel: 'telegram',
            });

            expect(responses.length).toBeGreaterThanOrEqual(1);
        });

        test('выбор английского языка через callback', async () => {
            const responses = await processMessage({
                userId: testUserId,
                callbackData: 'lang_en',
                channel: 'telegram',
            });

            expect(responses.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('processMessage() — callback навигации', () => {
        beforeEach(async () => {
            // Сначала выбираем язык → устанавливаем состояние
            await processMessage({
                userId: testUserId,
                callbackData: 'lang_ru',
                channel: 'telegram',
            });
        });

        test('показывает оборудование', async () => {
            const responses = await processMessage({
                userId: testUserId,
                callbackData: 'equipment',
                channel: 'telegram',
            });

            expect(responses).toHaveLength(1);
            expect(responses[0].keyboard).toBeDefined();
            expect(responses[0].keyboard.buttons.length).toBeGreaterThanOrEqual(3);
        });

        test('показывает цены', async () => {
            const responses = await processMessage({
                userId: testUserId,
                callbackData: 'prices',
                channel: 'telegram',
            });

            expect(responses).toHaveLength(1);
            expect(responses[0].text).toBeDefined();
        });

        test('показывает контакты', async () => {
            const responses = await processMessage({
                userId: testUserId,
                callbackData: 'contacts',
                channel: 'telegram',
            });

            expect(responses).toHaveLength(1);
            expect(responses[0].text).toContain('+371');
        });

        test('показывает время работы', async () => {
            const responses = await processMessage({
                userId: testUserId,
                callbackData: 'working_hours',
                channel: 'telegram',
            });

            expect(responses).toHaveLength(1);
            expect(responses[0].text).toBeDefined();
        });

        test('возврат в главное меню', async () => {
            const responses = await processMessage({
                userId: testUserId,
                callbackData: 'main_menu',
                channel: 'telegram',
            });

            expect(responses).toHaveLength(1);
            expect(getState(testUserId)).toBe(STATES.MAIN_MENU);
        });
    });

    describe('processMessage() — текстовые сообщения', () => {
        beforeEach(async () => {
            await processMessage({
                userId: testUserId,
                callbackData: 'lang_ru',
                channel: 'telegram',
            });
        });

        test('распознаёт запрос по ценам', async () => {
            const responses = await processMessage({
                userId: testUserId,
                text: 'цены',
                channel: 'telegram',
            });

            expect(responses.length).toBeGreaterThanOrEqual(1);
        });

        test('распознаёт запрос по контактам', async () => {
            const responses = await processMessage({
                userId: testUserId,
                text: 'контакты',
                channel: 'telegram',
            });

            expect(responses.length).toBeGreaterThanOrEqual(1);
        });

        test('распознаёт запрос по оборудованию', async () => {
            const responses = await processMessage({
                userId: testUserId,
                text: 'оборудование',
                channel: 'telegram',
            });

            expect(responses.length).toBeGreaterThanOrEqual(1);
        });

        test('показывает главное меню для неизвестного текста', async () => {
            const responses = await processMessage({
                userId: testUserId,
                text: 'абракадабра',
                channel: 'telegram',
            });

            expect(responses).toHaveLength(1);
            expect(responses[0].keyboard).toBeDefined();
        });
    });

    describe('processMessage() — заказ', () => {
        beforeEach(async () => {
            await processMessage({
                userId: testUserId,
                callbackData: 'lang_ru',
                channel: 'telegram',
            });
        });

        test('полный цикл: заказ → аренда → категория → чертежи', async () => {
            // Шаг 1: Заказать
            const r1 = await processMessage({
                userId: testUserId,
                callbackData: 'order',
                channel: 'telegram',
            });
            expect(r1).toHaveLength(1);
            expect(r1[0].keyboard).toBeDefined();

            // Шаг 2: Аренда
            const r2 = await processMessage({
                userId: testUserId,
                callbackData: 'type_rent',
                channel: 'telegram',
            });
            expect(r2).toHaveLength(1);
            expect(r2[0].keyboard).toBeDefined();

            // Шаг 3: Леса
            const r3 = await processMessage({
                userId: testUserId,
                callbackData: 'rent_scaffolding',
                channel: 'telegram',
            });
            expect(r3).toHaveLength(1);
            expect(r3[0].keyboard).toBeDefined();

            // Шаг 4: Нет чертежей
            const r4 = await processMessage({
                userId: testUserId,
                callbackData: 'has_drawings_no',
                channel: 'telegram',
            });
            expect(r4).toHaveLength(1);
        });
    });
});
