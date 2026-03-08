-- 003_clients.sql
-- Таблица клиентов
-- Clients table

CREATE TABLE IF NOT EXISTS clients (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE,
    name        TEXT,
    phone       TEXT,
    email       TEXT,
    language    TEXT DEFAULT 'ru' CHECK (language IN ('lv', 'ru', 'en')),
    channel     TEXT DEFAULT 'telegram' CHECK (channel IN ('telegram', 'web', 'phone')),
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients are readable by authenticated"
    ON clients FOR SELECT
    USING (true);

CREATE POLICY "Clients can be inserted"
    ON clients FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Clients can be updated"
    ON clients FOR UPDATE
    USING (true);
