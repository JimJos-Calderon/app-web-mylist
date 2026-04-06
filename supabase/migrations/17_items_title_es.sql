-- Título localizado en español (p. ej. TMDB es-ES) para búsqueda bilingüe.
-- La columna principal del ítem sigue siendo `titulo` (título original / canon).

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS title_es text NULL;

COMMENT ON COLUMN public.items.title_es IS 'Título en español (nullable); búsqueda conjunta con titulo.';
