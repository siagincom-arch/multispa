-- 002_prices.sql
-- Таблица цен (аренда / продажа)
-- Prices table (rental / sale)

CREATE TABLE IF NOT EXISTS prices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id    UUID NOT NULL REFERENCES equipment(id),
    type            TEXT NOT NULL CHECK (type IN ('rent', 'sale')),
    price_per_unit  NUMERIC NOT NULL,
    unit            TEXT NOT NULL DEFAULT 'm²',
    period          TEXT CHECK (period IN ('month', 'week', 'one-time')),
    vat_included    BOOLEAN DEFAULT false,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prices are readable by everyone"
    ON prices FOR SELECT
    USING (true);
