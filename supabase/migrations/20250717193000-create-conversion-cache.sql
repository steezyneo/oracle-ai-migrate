-- Migration: Create conversion_cache table for persistent conversion caching
create extension if not exists "uuid-ossp";

create table if not exists conversion_cache (
  id uuid primary key default uuid_generate_v4(),
  content_hash text not null unique,
  original_code text not null,
  converted_code text not null,
  created_at timestamp with time zone default now()
); 