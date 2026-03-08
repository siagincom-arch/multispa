-- 001_equipment.sql
-- Таблица оборудования (строительные леса, опалубка)
-- Equipment table (scaffolding, formwork)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS equipment (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category        TEXT NOT NULL CHECK (category IN ('scaffolding', 'wall_formwork', 'slab_formwork')),
    name_lv         TEXT NOT NULL,
    name_ru         TEXT NOT NULL,
    name_en         TEXT NOT NULL,
    description_lv  TEXT,
    description_ru  TEXT,
    description_en  TEXT,
    system_name     TEXT,
    specs           JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- Политика: чтение для всех (anon + authenticated)
CREATE POLICY "Equipment is readable by everyone"
    ON equipment FOR SELECT
    USING (true);
