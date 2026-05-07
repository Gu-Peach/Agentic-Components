create extension if not exists vector;

create table if not exists public.drawings (
  id text primary key,
  name text,
  category text,
  material text,
  summary text,
  gear_parameters jsonb,
  key_dimensions jsonb,
  tolerances jsonb,
  surface_roughness jsonb,
  inspection_items jsonb,
  technical_requirements jsonb,
  raw jsonb,
  embeding vector(768),
  path text,
  dataset text,
  source text,
  uploaded_at timestamptz not null default now()
);

create index if not exists drawings_category_idx on public.drawings (category);
create index if not exists drawings_material_idx on public.drawings (material);
create index if not exists drawings_gear_parameters_gin_idx on public.drawings using gin (gear_parameters);
create index if not exists drawings_key_dimensions_gin_idx on public.drawings using gin (key_dimensions);

-- Optional vector search index. Create it after data is loaded if you plan to query by similarity.
create index if not exists drawings_embeding_ivfflat_idx
  on public.drawings
  using ivfflat (embeding vector_cosine_ops)
  with (lists = 10);
