-- Розширення заявок заводчиків: приватний / розплідник / екзоти-гризуни

alter table public.applications add column if not exists breeder_type text
  check (breeder_type in ('private','kennel','exotic'));

-- Розплідник (kennel)
alter table public.applications add column if not exists kennel_name text;
alter table public.applications add column if not exists kennel_cert_doc_path text;
alter table public.applications add column if not exists name_matches_cert boolean;
alter table public.applications add column if not exists marriage_cert_doc_path text;

-- Екзоти та гризуни (exotic)
alter table public.applications add column if not exists exotic_has_docs boolean;
alter table public.applications add column if not exists exotic_doc_path text;       -- клубна довідка / CITES
alter table public.applications add column if not exists exotic_proof_path text;     -- фото/відео вольєрів з міткою
