-- 004_inquiries.sql
-- Таблица заявок (аренда / покупка)
-- Inquiries table (rent / purchase requests)

CREATE TABLE IF NOT EXISTS inquiries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id           UUID NOT NULL REFERENCES clients(id),
    type                TEXT CHECK (type IN ('rent', 'purchase')),
    equipment_category  TEXT,
    construction_type   TEXT,
    area                NUMERIC,
    height              NUMERIC,
    duration            TEXT,
    has_drawings        BOOLEAN DEFAULT false,
    file_url            TEXT,
    status              TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed')),
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inquiries are readable by authenticated"
    ON inquiries FOR SELECT
    USING (true);

CREATE POLICY "Inquiries can be inserted"
    ON inquiries FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Inquiries can be updated"
    ON inquiries FOR UPDATE
    USING (true);
