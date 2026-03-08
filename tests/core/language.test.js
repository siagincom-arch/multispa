// Tests — Language Detection (language.js)
// Тестируем определение языка и управление языком пользователя

const { detectLanguage, getUserLanguage, setUserLanguage, hasLanguage } = require('../../src/core/language');

describe('Language Module', () => {
    const testUserId = 'lang-test-user';

    describe('detectLanguage()', () => {
        test('определяет латышский по явному выбору', () => {
            expect(detectLanguage('latviešu')).toBe('lv');
            expect(detectLanguage('Latvian')).toBe('lv');
            expect(detectLanguage('🇱🇻')).toBe('lv');
            expect(detectLanguage('lv')).toBe('lv');
        });

        test('определяет русский по явному выбору', () => {
            expect(detectLanguage('русский')).toBe('ru');
            expect(detectLanguage('Russian')).toBe('ru');
            expect(detectLanguage('🇷🇺')).toBe('ru');
            expect(detectLanguage('ru')).toBe('ru');
        });

        test('определяет английский по явному выбору', () => {
            expect(detectLanguage('english')).toBe('en');
            expect(detectLanguage('English')).toBe('en');
            expect(detectLanguage('🇬🇧')).toBe('en');
            expect(detectLanguage('en')).toBe('en');
        });

        test('определяет латышский по специальным символам', () => {
            expect(detectLanguage('Sveicināti')).toBe('lv');
            expect(detectLanguage('Čau')).toBe('lv');
            expect(detectLanguage('Kādā valodā')).toBe('lv');
            expect(detectLanguage('būvniecības sastatnes')).toBe('lv');
        });

        test('определяет русский по кириллице', () => {
            expect(detectLanguage('Привет')).toBe('ru');
            expect(detectLanguage('Здравствуйте')).toBe('ru');
            expect(detectLanguage('аренда лесов')).toBe('ru');
            expect(detectLanguage('цена')).toBe('ru');
        });

        test('определяет английский по латинским символам (без латышских)', () => {
            expect(detectLanguage('Hello')).toBe('en');
            expect(detectLanguage('I need scaffolding')).toBe('en');
            expect(detectLanguage('prices')).toBe('en');
        });

        test('возвращает null для пустого ввода', () => {
            expect(detectLanguage(null)).toBeNull();
            expect(detectLanguage('')).toBeNull();
            expect(detectLanguage(undefined)).toBeNull();
        });

        test('возвращает null для чисел и спецсимволов', () => {
            expect(detectLanguage('12345')).toBeNull();
        });
    });

    describe('getUserLanguage() / setUserLanguage()', () => {
        test('возвращает null для нового пользователя', () => {
            expect(getUserLanguage('unknown-user')).toBeNull();
        });

        test('устанавливает и получает язык', () => {
            setUserLanguage(testUserId, 'ru');
            expect(getUserLanguage(testUserId)).toBe('ru');
        });

        test('меняет язык', () => {
            setUserLanguage(testUserId, 'ru');
            setUserLanguage(testUserId, 'lv');
            expect(getUserLanguage(testUserId)).toBe('lv');
        });

        test('не устанавливает неподдерживаемый язык', () => {
            setUserLanguage(testUserId, 'ru');
            setUserLanguage(testUserId, 'de'); // не поддерживается
            expect(getUserLanguage(testUserId)).toBe('ru'); // остаётся прежним
        });
    });

    describe('hasLanguage()', () => {
        test('возвращает false для нового пользователя', () => {
            expect(hasLanguage('no-lang-user')).toBe(false);
        });

        test('возвращает true после установки языка', () => {
            setUserLanguage('has-lang-user', 'en');
            expect(hasLanguage('has-lang-user')).toBe(true);
        });
    });
});
