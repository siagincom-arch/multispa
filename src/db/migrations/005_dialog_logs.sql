-- 005_dialog_logs.sql
-- Таблица логов диалогов
-- Dialog logs table

CREATE TABLE IF NOT EXISTS dialog_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id   UUID REFERENCES clients(id),
    channel     TEXT DEFAULT 'telegram' CHECK (channel IN ('telegram', 'web', 'phone')),
    language    TEXT DEFAULT 'ru' CHECK (language IN ('lv', 'ru', 'en')),
    message     TEXT NOT NULL,
    role        TEXT NOT NULL CHECK (role IN ('client', 'bot')),
    intent      TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE dialog_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dialog logs can be inserted"
    ON dialog_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Dialog logs are readable by authenticated"
    ON dialog_logs FOR SELECT
    USING (true);
