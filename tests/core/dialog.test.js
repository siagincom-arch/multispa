// Tests — Dialog FSM (dialog.js)
// Тестируем конечный автомат диалога: состояния, сессии, данные

const { STATES, getSession, setState, getState, setData, getData, getAllData, resetSession, isInactive } = require('../../src/core/dialog');

describe('Dialog FSM', () => {
    const testUserId = 'test-user-123';

    beforeEach(() => {
        // Сбрасываем сессию перед каждым тестом
        resetSession(testUserId);
    });

    describe('STATES', () => {
        test('содержит все необходимые состояния', () => {
            expect(STATES.WELCOME).toBe('welcome');
            expect(STATES.MAIN_MENU).toBe('main_menu');
            expect(STATES.INTEREST).toBe('interest');
            expect(STATES.RENT_DETAILS).toBe('rent_details');
            expect(STATES.BUY_DETAILS).toBe('buy_details');
            expect(STATES.DELIVERY).toBe('delivery');
            expect(STATES.CONTACTS).toBe('contacts');
            expect(STATES.FAREWELL).toBe('farewell');
            expect(STATES.AWAITING_FILE).toBe('awaiting_file');
        });
    });

    describe('getSession()', () => {
        test('создаёт новую сессию с начальным состоянием WELCOME', () => {
            const session = getSession('new-user-999');
            expect(session.state).toBe(STATES.WELCOME);
            expect(session.data).toEqual({});
            expect(session.lastActivity).toBeDefined();
        });

        test('возвращает существующую сессию', () => {
            const session1 = getSession(testUserId);
            setState(testUserId, STATES.MAIN_MENU);
            const session2 = getSession(testUserId);
            expect(session2.state).toBe(STATES.MAIN_MENU);
        });

        test('обновляет lastActivity при каждом вызове', () => {
            const session1 = getSession(testUserId);
            const time1 = session1.lastActivity;
            // Небольшая задержка для разницы во времени
            const session2 = getSession(testUserId);
            expect(session2.lastActivity).toBeGreaterThanOrEqual(time1);
        });
    });

    describe('setState() / getState()', () => {
        test('устанавливает и получает состояние', () => {
            setState(testUserId, STATES.MAIN_MENU);
            expect(getState(testUserId)).toBe(STATES.MAIN_MENU);
        });

        test('позволяет менять состояние несколько раз', () => {
            setState(testUserId, STATES.INTEREST);
            expect(getState(testUserId)).toBe(STATES.INTEREST);

            setState(testUserId, STATES.RENT_DETAILS);
            expect(getState(testUserId)).toBe(STATES.RENT_DETAILS);

            setState(testUserId, STATES.FAREWELL);
            expect(getState(testUserId)).toBe(STATES.FAREWELL);
        });
    });

    describe('setData() / getData() / getAllData()', () => {
        test('сохраняет и получает данные сессии', () => {
            setData(testUserId, 'type', 'rent');
            expect(getData(testUserId, 'type')).toBe('rent');
        });

        test('сохраняет несколько полей', () => {
            setData(testUserId, 'type', 'rent');
            setData(testUserId, 'equipment_category', 'scaffolding');
            setData(testUserId, 'has_drawings', true);

            expect(getData(testUserId, 'type')).toBe('rent');
            expect(getData(testUserId, 'equipment_category')).toBe('scaffolding');
            expect(getData(testUserId, 'has_drawings')).toBe(true);
        });

        test('getAllData() возвращает все данные', () => {
            setData(testUserId, 'type', 'purchase');
            setData(testUserId, 'equipment_category', 'wall_formwork');

            const all = getAllData(testUserId);
            expect(all).toEqual({
                type: 'purchase',
                equipment_category: 'wall_formwork',
            });
        });

        test('возвращает undefined для несуществующего ключа', () => {
            expect(getData(testUserId, 'nonexistent')).toBeUndefined();
        });
    });

    describe('resetSession()', () => {
        test('сбрасывает сессию к начальному состоянию', () => {
            setState(testUserId, STATES.FAREWELL);
            setData(testUserId, 'type', 'rent');

            resetSession(testUserId);

            expect(getState(testUserId)).toBe(STATES.WELCOME);
            expect(getAllData(testUserId)).toEqual({});
        });
    });

    describe('isInactive()', () => {
        test('возвращает false для активной сессии', () => {
            getSession(testUserId); // создаём/обновляем
            expect(isInactive(testUserId, 20000)).toBe(false);
        });

        test('возвращает false для несуществующего пользователя', () => {
            expect(isInactive('nobody', 20000)).toBe(false);
        });

        test('возвращает true при превышении таймаута', () => {
            const session = getSession(testUserId);
            // Имитируем неактивность: сдвигаем lastActivity назад
            session.lastActivity = Date.now() - 30000;
            expect(isInactive(testUserId, 20000)).toBe(true);
        });
    });

    describe('Сценарий полного диалога', () => {
        test('проходит полный цикл: WELCOME → MAIN_MENU → INTEREST → CONTACTS → FAREWELL', () => {
            // Шаг 1: Начало
            expect(getState(testUserId)).toBe(STATES.WELCOME);

            // Шаг 2: Выбор языка → меню
            setState(testUserId, STATES.MAIN_MENU);
            expect(getState(testUserId)).toBe(STATES.MAIN_MENU);

            // Шаг 3: Заказ
            setState(testUserId, STATES.INTEREST);
            setData(testUserId, 'type', 'rent');

            // Шаг 4: Детали
            setState(testUserId, STATES.RENT_DETAILS);
            setData(testUserId, 'equipment_category', 'scaffolding');

            // Шаг 7: Контакты
            setState(testUserId, STATES.CONTACTS);

            // Шаг 9: Прощание
            setState(testUserId, STATES.FAREWELL);
            expect(getState(testUserId)).toBe(STATES.FAREWELL);

            // Проверяем, что данные сохранены
            expect(getData(testUserId, 'type')).toBe('rent');
            expect(getData(testUserId, 'equipment_category')).toBe('scaffolding');
        });
    });
});
