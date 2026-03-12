const { detectLanguage } = require('../src/core/language');

describe('detectLanguage — улучшенная версия', () => {
    // === Явный выбор языка ===
    test('явный выбор: "русский" → ru', () => {
        expect(detectLanguage('русский')).toBe('ru');
    });

    test('явный выбор: "english" → en', () => {
        expect(detectLanguage('english')).toBe('en');
    });

    test('явный выбор: "🇱🇻" → lv', () => {
        expect(detectLanguage('🇱🇻')).toBe('lv');
    });

    // === Кириллица (русский) ===
    test('русская фраза → ru', () => {
        expect(detectLanguage('Привет, мне нужна аренда лесов')).toBe('ru');
    });

    test('короткое русское слово → ru', () => {
        expect(detectLanguage('Привет')).toBe('ru');
    });

    test('русский текст с цифрами → ru', () => {
        expect(detectLanguage('Мне нужно 50 м²')).toBe('ru');
    });

    test('русский текст с email → ru (не en)', () => {
        expect(detectLanguage('Мой email info@company.com')).toBe('ru');
    });

    // === Латышский ===
    test('латышская фраза → lv', () => {
        expect(detectLanguage('Sveiki, man vajag sastatnes')).toBe('lv');
    });

    test('латышские диакритики → lv', () => {
        expect(detectLanguage('Cik maksā veidņi?')).toBe('lv');
    });

    // === Английский ===
    test('английская фраза → en', () => {
        expect(detectLanguage('Hello, I need scaffolding rental')).toBe('en');
    });

    test('короткое английское слово → en', () => {
        expect(detectLanguage('Hello')).toBe('en');
    });

    // === Null-случаи (не определяем язык) ===
    test('только цифры → null', () => {
        expect(detectLanguage('50')).toBe(null);
    });

    test('только знаки → null', () => {
        expect(detectLanguage('+')).toBe(null);
    });

    test('пустая строка → null', () => {
        expect(detectLanguage('')).toBe(null);
    });

    test('null → null', () => {
        expect(detectLanguage(null)).toBe(null);
    });

    test('один символ → null', () => {
        expect(detectLanguage('5')).toBe(null);
    });
});
