-- 006_faq.sql
-- Таблица FAQ (часто задаваемые вопросы)
-- FAQ table (multilingual)

CREATE TABLE IF NOT EXISTS faq (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_lv TEXT NOT NULL,
    question_ru TEXT NOT NULL,
    question_en TEXT NOT NULL,
    answer_lv   TEXT NOT NULL,
    answer_ru   TEXT NOT NULL,
    answer_en   TEXT NOT NULL,
    category    TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FAQ is readable by everyone"
    ON faq FOR SELECT
    USING (true);
