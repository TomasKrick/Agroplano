-- AgroPlano Gestión Demo · backend multiusuario genérico
-- Ejecutar únicamente en un proyecto Supabase nuevo y exclusivo de AgroPlano.
-- No contiene usuarios, establecimientos, geometrías ni datos precargados.

create extension if not exists pgcrypto;

-- El cliente verifica esta identidad antes de leer datos. Así, si por error se
-- pega la URL de otro proyecto Supabase, la aplicación se detiene en vez de
-- abrir o escribir una base que no le pertenece.
create or replace function public.agroplano_backend_identity()
returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'applicationId', 'agroplano-gestion-demo',
    'backendSchemaVersion', 1
  )
$$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  timezone text not null default 'America/Argentina/Buenos_Aires',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','editor','viewer')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.app_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  doc_key text not null default 'main',
  state jsonb not null,
  version bigint not null default 1 check (version > 0),
  schema_version integer not null check (schema_version > 0),
  state_hash text not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid not null references auth.users(id),
  unique (workspace_id, doc_key)
);

create table if not exists public.app_document_versions (
  id bigint generated always as identity primary key,
  document_id uuid not null references public.app_documents(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  version bigint not null,
  state jsonb not null,
  state_hash text not null,
  schema_version integer not null,
  action text not null default 'edit',
  note text not null default '',
  device_id text not null default '',
  app_version text not null default '',
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  unique (document_id, version)
);

create table if not exists public.app_mutations (
  document_id uuid not null references public.app_documents(id) on delete cascade,
  mutation_id uuid not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  committed_version bigint not null,
  state_hash text not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  primary key (document_id, mutation_id)
);

create index if not exists workspace_members_user_idx on public.workspace_members(user_id);
create index if not exists app_documents_workspace_idx on public.app_documents(workspace_id);
create index if not exists app_document_versions_document_idx on public.app_document_versions(document_id, version desc);
-- Una misma operación enviada dos veces por el mismo usuario debe producir un
-- solo efecto, incluso si el primer intento llegó al servidor pero la respuesta
-- se perdió por un corte de conexión.
create unique index if not exists app_mutations_actor_mutation_uidx
  on public.app_mutations(created_by, mutation_id);

create or replace function public.workspace_role(p_workspace_id uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select wm.role from public.workspace_members wm
  where wm.workspace_id = p_workspace_id and wm.user_id = auth.uid()
$$;

create or replace function public.validate_agroplano_state(p_state jsonb)
returns void
language plpgsql
immutable
set search_path = public, pg_temp
as $$
begin
  if p_state is null or jsonb_typeof(p_state) is distinct from 'object' then
    raise exception using errcode='22023', message='El estado debe ser un objeto JSON';
  end if;
  if jsonb_typeof(p_state -> 'lots') is distinct from 'array' then
    raise exception using errcode='22023', message='El estado debe contener una lista de lotes';
  end if;
  if jsonb_array_length(p_state -> 'lots') < 1 then
    raise exception using errcode='22023', message='El estado debe contener al menos un lote';
  end if;
  if jsonb_typeof(p_state -> 'schemaVersion') is distinct from 'number' then
    raise exception using errcode='22023', message='Falta la versión de esquema del estado';
  end if;
  if jsonb_typeof(coalesce(p_state -> 'movements', '[]'::jsonb)) is distinct from 'array' then
    raise exception using errcode='22023', message='El libro de movimientos debe ser una lista';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_state -> 'lots') item
    where jsonb_typeof(item) <> 'object' or nullif(trim(item ->> 'id'), '') is null
  ) or exists (
    select 1 from (
      select item ->> 'id' as id, count(*)
      from jsonb_array_elements(p_state -> 'lots') item
      group by item ->> 'id'
      having count(*) > 1
    ) duplicated_lots
  ) then
    raise exception using errcode='22023', message='Cada lote debe tener un identificador único';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_state -> 'movements', '[]'::jsonb)) item
    where jsonb_typeof(item) <> 'object' or nullif(trim(item ->> 'id'), '') is null
  ) or exists (
    select 1 from (
      select item ->> 'id' as id, count(*)
      from jsonb_array_elements(coalesce(p_state -> 'movements', '[]'::jsonb)) item
      group by item ->> 'id'
      having count(*) > 1
    ) duplicated_movements
  ) then
    raise exception using errcode='22023', message='Cada movimiento debe tener un identificador único';
  end if;
  if octet_length(p_state::text) > 5242880 then
    raise exception using errcode='22023', message='El documento supera el límite de 5 MB';
  end if;
end;
$$;

create or replace function public.editor_state_is_append_only(p_old jsonb, p_new jsonb)
returns boolean
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  old_item jsonb;
begin
  -- Los catálogos y su auditoría sólo pueden ser administrados por un admin.
  if coalesce(p_old->'herds','[]'::jsonb) <> coalesce(p_new->'herds','[]'::jsonb)
     or coalesce(p_old->'cattleCategories','[]'::jsonb) <> coalesce(p_new->'cattleCategories','[]'::jsonb)
     or coalesce(p_old->'cropCatalog','[]'::jsonb) <> coalesce(p_new->'cropCatalog','[]'::jsonb)
     or coalesce(p_old->'catalogAudit','[]'::jsonb) <> coalesce(p_new->'catalogAudit','[]'::jsonb) then
    return false;
  end if;

  -- Un editor puede agregar movimientos, pero nunca quitar ni reescribir el libro previo.
  for old_item in select value from jsonb_array_elements(coalesce(p_old->'movements','[]'::jsonb)) loop
    if not exists (
      select 1 from jsonb_array_elements(coalesce(p_new->'movements','[]'::jsonb)) new_item
      where new_item->>'id' = old_item->>'id' and new_item = old_item
    ) then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.app_documents enable row level security;
alter table public.app_document_versions enable row level security;
alter table public.app_mutations enable row level security;

drop policy if exists workspaces_read_members on public.workspaces;
create policy workspaces_read_members on public.workspaces for select to authenticated
using (public.workspace_role(id) is not null);

drop policy if exists members_read_workspace on public.workspace_members;
create policy members_read_workspace on public.workspace_members for select to authenticated
using (user_id = auth.uid() or public.workspace_role(workspace_id) = 'admin');

drop policy if exists documents_read_workspace on public.app_documents;
create policy documents_read_workspace on public.app_documents for select to authenticated
using (public.workspace_role(workspace_id) is not null);

drop policy if exists versions_read_admin on public.app_document_versions;
create policy versions_read_admin on public.app_document_versions for select to authenticated
using (public.workspace_role(workspace_id) = 'admin');

revoke all on public.workspaces, public.workspace_members, public.app_documents, public.app_document_versions, public.app_mutations from anon;
-- RLS no protege TRUNCATE, REFERENCES ni TRIGGER. Se revocan todos los
-- privilegios directos y luego se concede únicamente la lectura necesaria;
-- toda escritura pasa por RPCs SECURITY DEFINER con validación de rol y CAS.
revoke all on public.workspaces, public.workspace_members, public.app_documents, public.app_document_versions, public.app_mutations from authenticated;
revoke all on sequence public.app_document_versions_id_seq from anon, authenticated;
grant select on public.workspaces, public.workspace_members, public.app_documents to authenticated;
grant select on public.app_document_versions to authenticated;

create or replace function public.create_workspace_with_state(
  p_name text,
  p_initial_state jsonb,
  p_schema_version integer,
  p_mutation_id uuid,
  p_device_id text default '',
  p_app_version text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  workspace_id uuid;
  document_id uuid;
  state_hash text;
  prior_role text;
  prior_version bigint;
  prior_hash text;
begin
  if actor is null then raise exception using errcode='42501', message='Debe iniciar sesión'; end if;
  if p_mutation_id is null then raise exception using errcode='22023', message='Falta identificador de operación'; end if;

  -- Serializa los reintentos del alta. Sin este bloqueo, dos solicitudes
  -- simultáneas con el mismo mutation_id podrían crear dos establecimientos
  -- antes de que alguna alcanzara a registrar la mutación.
  perform pg_advisory_xact_lock(hashtextextended(actor::text || ':' || p_mutation_id::text, 0));
  select m.workspace_id, m.document_id, wm.role, d.version, d.state_hash
    into workspace_id, document_id, prior_role, prior_version, prior_hash
    from public.app_mutations m
    join public.app_documents d on d.id = m.document_id
    left join public.workspace_members wm
      on wm.workspace_id = m.workspace_id and wm.user_id = actor
    where m.created_by = actor and m.mutation_id = p_mutation_id
    limit 1;
  if found then
    return jsonb_build_object(
      'workspaceId', workspace_id,
      'documentId', document_id,
      'role', coalesce(prior_role, 'viewer'),
      'version', prior_version,
      'stateHash', prior_hash,
      'status', 'already_committed'
    );
  end if;

  if nullif(trim(p_name), '') is null then raise exception using errcode='22023', message='Escriba un nombre para el establecimiento'; end if;
  perform public.validate_agroplano_state(p_initial_state);
  if coalesce(p_schema_version,0) < 1
     or (p_initial_state ->> 'schemaVersion')::integer <> p_schema_version then
    raise exception using errcode='22023', message='Versión de esquema inválida';
  end if;

  state_hash := encode(digest(p_initial_state::text, 'sha256'), 'hex');
  insert into public.workspaces(name, created_by) values (trim(p_name), actor) returning id into workspace_id;
  insert into public.workspace_members(workspace_id,user_id,role,created_by) values (workspace_id,actor,'admin',actor);
  insert into public.app_documents(workspace_id,doc_key,state,version,schema_version,state_hash,created_by,updated_by)
    values (workspace_id,'main',p_initial_state,1,p_schema_version,state_hash,actor,actor) returning id into document_id;
  insert into public.app_document_versions(document_id,workspace_id,version,state,state_hash,schema_version,action,note,device_id,app_version,created_by)
    values (document_id,workspace_id,1,p_initial_state,state_hash,p_schema_version,'create','Base inicial',coalesce(p_device_id,''),coalesce(p_app_version,''),actor);
  insert into public.app_mutations(document_id,mutation_id,workspace_id,committed_version,state_hash,created_by)
    values (document_id,p_mutation_id,workspace_id,1,state_hash,actor);

  return jsonb_build_object('workspaceId',workspace_id,'documentId',document_id,'role','admin','version',1,'stateHash',state_hash);
end;
$$;

create or replace function public.set_workspace_member_by_email(
  p_workspace_id uuid,
  p_email text,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor uuid := auth.uid();
  target_user uuid;
  previous_role text;
  admin_count integer;
begin
  if public.workspace_role(p_workspace_id) is distinct from 'admin' then raise exception using errcode='42501', message='Se requiere rol Administrador'; end if;
  if p_role is null or p_role not in ('admin','editor','viewer') then raise exception using errcode='22023', message='Rol inválido'; end if;
  select id into target_user from auth.users where lower(email)=lower(trim(p_email)) limit 1;
  if target_user is null then raise exception using errcode='22023', message='El usuario todavía no existe en Auth'; end if;

  -- Bloquea el establecimiento mientras se cuenta a los administradores para
  -- impedir dos degradaciones concurrentes que lo dejen sin nadie que pueda
  -- administrar usuarios y catálogos.
  perform 1 from public.workspaces where id = p_workspace_id for update;
  if public.workspace_role(p_workspace_id) is distinct from 'admin' then
    raise exception using errcode='42501', message='El permiso de Administrador cambió durante la operación';
  end if;
  select role into previous_role from public.workspace_members
    where workspace_id = p_workspace_id and user_id = target_user;
  if previous_role = 'admin' and p_role <> 'admin' then
    select count(*) into admin_count from public.workspace_members
      where workspace_id = p_workspace_id and role = 'admin';
    if admin_count <= 1 then
      raise exception using errcode='22023', message='Debe quedar al menos un Administrador';
    end if;
  end if;

  insert into public.workspace_members(workspace_id,user_id,role,created_by,updated_at)
    values (p_workspace_id,target_user,p_role,actor,now())
  on conflict (workspace_id,user_id) do update set role=excluded.role,updated_at=now();
  return jsonb_build_object('workspaceId',p_workspace_id,'userId',target_user,'role',p_role);
end;
$$;

create or replace function public.commit_app_state(
  p_document_id uuid,
  p_expected_version bigint,
  p_state jsonb,
  p_schema_version integer,
  p_mutation_id uuid,
  p_action text default 'edit',
  p_note text default '',
  p_device_id text default '',
  p_app_version text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  doc public.app_documents%rowtype;
  member_role text;
  existing_version bigint;
  existing_hash text;
  next_version bigint;
  next_hash text;
begin
  if actor is null then raise exception using errcode='42501', message='Debe iniciar sesión'; end if;
  if p_mutation_id is null then raise exception using errcode='22023', message='Falta identificador de operación'; end if;

  select * into doc from public.app_documents where id=p_document_id for update;
  if not found then raise exception using errcode='22023', message='Documento inexistente'; end if;
  member_role := public.workspace_role(doc.workspace_id);
  if member_role is null or member_role not in ('admin','editor') then raise exception using errcode='42501', message='El usuario es de solo lectura'; end if;

  select committed_version,state_hash into existing_version,existing_hash
    from public.app_mutations where document_id=p_document_id and mutation_id=p_mutation_id;
  if found then
    return jsonb_build_object('status','already_committed','committedVersion',existing_version,'currentVersion',doc.version,'stateHash',existing_hash);
  end if;

  if p_schema_version is distinct from doc.schema_version then
    return jsonb_build_object('status','schema_mismatch','currentVersion',doc.version,'serverSchemaVersion',doc.schema_version);
  end if;
  if p_expected_version is distinct from doc.version then
    return jsonb_build_object('status','conflict','currentVersion',doc.version,'stateHash',doc.state_hash);
  end if;
  perform public.validate_agroplano_state(p_state);
  if (p_state ->> 'schemaVersion')::integer is distinct from p_schema_version then
    raise exception using errcode='22023', message='La versión interna del estado no coincide';
  end if;
  if member_role='editor' and not public.editor_state_is_append_only(doc.state,p_state) then
    raise exception using errcode='42501', message='Un Editor no puede modificar catálogos ni reescribir movimientos previos';
  end if;

  next_hash := encode(digest(p_state::text, 'sha256'), 'hex');
  if next_hash = doc.state_hash then
    insert into public.app_mutations(document_id,mutation_id,workspace_id,committed_version,state_hash,created_by)
      values (doc.id,p_mutation_id,doc.workspace_id,doc.version,doc.state_hash,actor);
    return jsonb_build_object('status','noop','committedVersion',doc.version,'currentVersion',doc.version,'stateHash',doc.state_hash);
  end if;

  next_version := doc.version + 1;
  update public.app_documents set state=p_state,version=next_version,state_hash=next_hash,updated_at=now(),updated_by=actor
    where id=doc.id;
  insert into public.app_document_versions(document_id,workspace_id,version,state,state_hash,schema_version,action,note,device_id,app_version,created_by)
    values (doc.id,doc.workspace_id,next_version,p_state,next_hash,p_schema_version,left(coalesce(p_action,'edit'),80),left(coalesce(p_note,''),500),left(coalesce(p_device_id,''),160),left(coalesce(p_app_version,''),40),actor);
  insert into public.app_mutations(document_id,mutation_id,workspace_id,committed_version,state_hash,created_by)
    values (doc.id,p_mutation_id,doc.workspace_id,next_version,next_hash,actor);
  return jsonb_build_object('status','ok','committedVersion',next_version,'currentVersion',next_version,'stateHash',next_hash);
end;
$$;

revoke all on function public.create_workspace_with_state(text,jsonb,integer,uuid,text,text) from public;
revoke all on function public.set_workspace_member_by_email(uuid,text,text) from public;
revoke all on function public.commit_app_state(uuid,bigint,jsonb,integer,uuid,text,text,text,text) from public;
revoke all on function public.workspace_role(uuid) from public;
revoke all on function public.validate_agroplano_state(jsonb) from public;
revoke all on function public.editor_state_is_append_only(jsonb,jsonb) from public;
revoke all on function public.agroplano_backend_identity() from public;
grant execute on function public.create_workspace_with_state(text,jsonb,integer,uuid,text,text) to authenticated;
grant execute on function public.set_workspace_member_by_email(uuid,text,text) to authenticated;
grant execute on function public.commit_app_state(uuid,bigint,jsonb,integer,uuid,text,text,text,text) to authenticated;
-- Las políticas RLS se evalúan con el rol del usuario y necesitan poder llamar
-- a este helper; los otros dos helpers quedan disponibles sólo para los RPC
-- SECURITY DEFINER.
grant execute on function public.workspace_role(uuid) to authenticated;
grant execute on function public.agroplano_backend_identity() to anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_publication where pubname='supabase_realtime') then
    raise exception 'No existe la publicación supabase_realtime. Ejecute esta migración dentro de Supabase.';
  end if;
  if not exists (
    select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='app_documents'
  ) then
    alter publication supabase_realtime add table public.app_documents;
  end if;
  if not exists (
    select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='workspace_members'
  ) then
    alter publication supabase_realtime add table public.workspace_members;
  end if;
end $$;
