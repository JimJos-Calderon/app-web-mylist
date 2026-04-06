-- Tema visual por lista (notificaciones Discord, futura UI). NULL = estilo por defecto en la edge function.

ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS theme text NULL;

ALTER TABLE public.lists
  DROP CONSTRAINT IF EXISTS lists_theme_valid;

ALTER TABLE public.lists
  ADD CONSTRAINT lists_theme_valid
  CHECK (theme IS NULL OR theme IN ('cyberpunk', 'terminal', 'retro-cartoon'));

COMMENT ON COLUMN public.lists.theme IS
  'Tema para personalizar embeds (Discord): cyberpunk | terminal | retro-cartoon. NULL = default.';
