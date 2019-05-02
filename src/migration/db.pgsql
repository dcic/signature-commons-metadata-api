-- primary database
CREATE TABLE public.libraries
(
  id integer NOT NULL,
  uuid uuid NOT NULL,
  meta jsonb,
  dataset character varying NOT NULL,
  dataset_type character varying NOT NULL,
  signature_keys jsonb
);

CREATE TABLE public.signatures
(
    id integer NOT NULL,
    uuid uuid NOT NULL,
    libid uuid NOT NULL,
    meta jsonb,
    meta_tsvector tsvector
);

CREATE TABLE public.entities
(
    id integer NOT NULL,
    uuid uuid NOT NULL,
    meta jsonb
);



-- indexes for optimized queries

-- materialized views

-- materialized views for key/value counting
create materialized view public.libraries_key_value_counts
as
with recursive r as (
    select
      v.key::text as key,
      v.value as value
    from
      libraries,
      jsonb_each(libraries.meta::jsonb) as v
  union all
    select _r.*
    from
      r cross join lateral (
        select
          concat(r.key::text, '.', r_obj.key::text) as key,
          r_obj.value as value
        from jsonb_each(r.value) as r_obj
        where jsonb_typeof(r.value) = 'object'
          union
        select
          r.key::text as key,
          r_arr.value as value
        from jsonb_array_elements(r.value) as r_arr
        where jsonb_typeof(r.value) = 'array'
      ) as _r
)
select
  r.key as "key",
  case
    when jsonb_typeof(r.value) = 'object' then to_json('[object]'::text)::jsonb
    when jsonb_typeof(r.value) = 'array' then to_json('[array]'::text)::jsonb
    else r.value::jsonb
  end as "value",
  count(*) as "count"
from
  r
group by
  r.key,
  r.value
order by
  "count" desc;

create materialized view public.entities_key_value_counts
as
with recursive r as (
    select
      v.key::text as key,
      v.value as value
    from
      entities,
      jsonb_each(entities.meta::jsonb) as v
  union all
    select _r.*
    from
      r cross join lateral (
        select
          concat(r.key::text, '.', r_obj.key::text) as key,
          r_obj.value as value
        from jsonb_each(r.value) as r_obj
        where jsonb_typeof(r.value) = 'object'
          union
        select
          r.key::text as key,
          r_arr.value as value
        from jsonb_array_elements(r.value) as r_arr
        where jsonb_typeof(r.value) = 'array'
      ) as _r
)
select
  r.key as "key",
  case
    when jsonb_typeof(r.value) = 'object' then to_json('[object]'::text)::jsonb
    when jsonb_typeof(r.value) = 'array' then to_json('[array]'::text)::jsonb
    else r.value::jsonb
  end as "value",
  count(*) as "count"
from
  r
group by
  r.key,
  r.value
order by
  "count" desc;

create materialized view public.signatures_key_value_counts
as
with recursive r as (
    select
      v.key::text as key,
      v.value as value
    from
      signatures,
      jsonb_each(signatures.meta::jsonb) as v
  union all
    select _r.*
    from
      r cross join lateral (
        select
          concat(r.key::text, '.', r_obj.key::text) as key,
          r_obj.value as value
        from jsonb_each(r.value) as r_obj
        where jsonb_typeof(r.value) = 'object'
          union
        select
          r.key::text as key,
          r_arr.value as value
        from jsonb_array_elements(r.value) as r_arr
        where jsonb_typeof(r.value) = 'array'
      ) as _r
)
select
  r.key as "key",
  case
    when jsonb_typeof(r.value) = 'object' then to_json('[object]'::text)::jsonb
    when jsonb_typeof(r.value) = 'array' then to_json('[array]'::text)::jsonb
    else r.value::jsonb
  end as "value",
  count(*) as "count"
from
  r
group by
  r.key,
  r.value
order by
  "count" desc;

create materialized view public.libraries_signatures_key_value_counts
as
with recursive r as (
    select
      s.libid as library,
      v.key::text as key,
      v.value as value
    from
      signatures as s,
      jsonb_each(s.meta::jsonb) as v
  union all
    select _r.*
    from
      r cross join lateral (
        select
          r.library as library,
          concat(r.key::text, '.', r_obj.key::text) as key,
          r_obj.value as value
        from jsonb_each(r.value) as r_obj
        where jsonb_typeof(r.value) = 'object'
          union
        select
          r.library as library,
          r.key::text as key,
          r_arr.value as value
        from jsonb_array_elements(r.value) as r_arr
        where jsonb_typeof(r.value) = 'array'
      ) as _r
)
select
  r.library as "library",
  r.key as "key",
  case
    when jsonb_typeof(r.value) = 'object' then to_json('[object]'::text)::jsonb
    when jsonb_typeof(r.value) = 'array' then to_json('[array]'::text)::jsonb
    else r.value::jsonb
  end as "value",
  count(*) as "count"
from
  r
group by
  r.library,
  r.key,
  r.value
order by
  "count" desc;
