create extension if not exists vector;

alter table public.drawings
rename column embeding to embedding;

alter table public.drawings
alter column gear_parameters set default '{}'::jsonb,
alter column key_dimensions set default '{}'::jsonb,
alter column tolerances set default '{}'::jsonb,
alter column surface_roughness set default '[]'::jsonb,
alter column inspection_items set default '{}'::jsonb,
alter column technical_requirements set default '[]'::jsonb,
alter column raw set default '{}'::jsonb;

create unique index if not exists drawings_path_uidx on public.drawings (path);

drop index if exists drawings_embeding_ivfflat_idx;

create index if not exists drawings_embedding_ivfflat_idx
  on public.drawings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 10);
