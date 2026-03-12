// Tests — i18n (Internationalization)
// Тестируем систему переводов: t(), getTranslations(), fallback

const { t, getTranslations, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } = require('../../src/i18n');

describe('i18n Module', () => {

    describe('Константы', () => {
        test('поддерживает 3 языка: lv, ru, en', () => {
            expect(SUPPORTED_LANGUAGES).toEqual(['lv', 'ru', 'en']);
        });

        test('язык по умолчанию — ru', () => {
            expect(DEFAULT_LANGUAGE).toBe('ru');
        });
    });

    describe('t() — перевод по ключу', () => {
        test('возвращает перевод на русском', () => {
            const result = t('ru', 'main_menu');
            expect(result).toContain('Чем могу');
        });

        test('возвращает перевод на латышском', () => {
            const result = t('lv', 'main_menu');
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        test('возвращает перевод на английском', () => {
            const result = t('en', 'main_menu');
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        test('возвращает ключ для несуществующего перевода', () => {
            const result = t('ru', 'nonexistent_key_xyz');
            expect(result).toBe('nonexistent_key_xyz');
        });

        test('использует русский по умолчанию для неподдерживаемого языка', () => {
            const result = t('de', 'main_menu');
            expect(result).toContain('Чем могу');
        });

        test('все основные ключи существуют на русском', () => {
            const requiredKeys = [
                'welcome', 'choose_language', 'lang_selected', 'main_menu',
                'equipment', 'scaffolding', 'wall_formwork', 'slab_formwork',
                'prices', 'order', 'upload_drawing', 'faq', 'contacts',
                'working_hours', 'rental', 'purchase', 'back',
                'contact_specialist', 'farewell', 'yes', 'no',
            ];

            requiredKeys.forEach(key => {
                const value = t('ru', key);
                expect(value).not.toBe(key); // Не должен возвращать ключ как есть
                expect(value.length).toBeGreaterThan(0);
            });
        });

        test('все основные ключи существуют на латышском', () => {
            const requiredKeys = [
                'main_menu', 'equipment', 'scaffolding', 'prices',
                'contacts', 'working_hours', 'back', 'yes', 'no',
            ];

            requiredKeys.forEach(key => {
                const value = t('lv', key);
                expect(value).not.toBe(key);
                expect(value.length).toBeGreaterThan(0);
            });
        });

        test('все основные ключи существуют на английском', () => {
            const requiredKeys = [
                'main_menu', 'equipment', 'scaffolding', 'prices',
                'contacts', 'working_hours', 'back', 'yes', 'no',
            ];

            requiredKeys.forEach(key => {
                const value = t('en', key);
                expect(value).not.toBe(key);
                expect(value.length).toBeGreaterThan(0);
            });
        });
    });

    describe('getTranslations()', () => {
        test('возвращает все переводы для русского', () => {
            const translations = getTranslations('ru');
            expect(translations).toBeDefined();
            expect(typeof translations).toBe('object');
            expect(translations.main_menu).toContain('Чем могу');
        });

        test('возвращает все переводы для латышского', () => {
            const translations = getTranslations('lv');
            expect(translations).toBeDefined();
            expect(typeof translations).toBe('object');
        });

        test('возвращает все переводы для английского', () => {
            const translations = getTranslations('en');
            expect(translations).toBeDefined();
            expect(typeof translations).toBe('object');
        });

        test('возвращает русские переводы для неподдерживаемого языка', () => {
            const translations = getTranslations('de');
            const ruTranslations = getTranslations('ru');
            expect(translations).toEqual(ruTranslations);
        });
    });

    describe('Консистентность переводов', () => {
        test('все языки содержат одинаковый набор ключей', () => {
            const ruKeys = Object.keys(getTranslations('ru')).sort();
            const lvKeys = Object.keys(getTranslations('lv')).sort();
            const enKeys = Object.keys(getTranslations('en')).sort();

            expect(lvKeys).toEqual(ruKeys);
            expect(enKeys).toEqual(ruKeys);
        });
    });
});
