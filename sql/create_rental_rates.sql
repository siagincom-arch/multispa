-- Таблица базовых ставок аренды для калькулятора
-- Управляется через Supabase Dashboard

CREATE TABLE IF NOT EXISTS rental_rates (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category    TEXT NOT NULL UNIQUE,          -- scaffolding_modular, scaffolding_frame, wall_formwork, slab_formwork
    rate        NUMERIC(10,2) NOT NULL,        -- €/м²
    period      TEXT NOT NULL DEFAULT 'month', -- month | week
    label_ru    TEXT,                          -- «Модульные леса» — для удобства в Dashboard
    label_lv    TEXT,
    label_en    TEXT,
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Начальные данные (те же что были в коде)
INSERT INTO rental_rates (category, rate, period, label_ru, label_lv, label_en) VALUES
    ('scaffolding_modular', 2.20, 'month', 'Модульные леса',        'Modulārās sastatnes',   'Modular scaffolding'),
    ('scaffolding_frame',   1.40, 'month', 'Рамные леса',           'Rāmju sastatnes',       'Frame scaffolding'),
    ('wall_formwork',       6.00, 'week',  'Стеновая опалубка',     'Sienu veidņi',          'Wall formwork'),
    ('slab_formwork',       3.00, 'week',  'Опалубка перекрытий',   'Pārsegumu veidņi',      'Slab formwork')
ON CONFLICT (category) DO NOTHING;

-- RLS: разрешить чтение всем (anon/authenticated), запись только через Dashboard
ALTER TABLE rental_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rental_rates_read" ON rental_rates
    FOR SELECT USING (true);
