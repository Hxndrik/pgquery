-- pgquery demo database: a small record store.
--
-- The proxy runs this file itself (see proxy/demo.go) when DEMO_DATABASE_URL
-- is set: on startup and then every DEMO_RESET_INTERVAL. It runs as one
-- transaction with the admin credentials, drops and recreates everything it
-- owns, and creates a SELECT-only `demo` role. The proxy then sets a fresh
-- random password on that role and serves the demo through it only.

-- Extensions live in their own schema so `public` holds only the sample tables.
-- pg_stat_statements is optional. Its views only work when the server preloads
-- the library (shared_preload_libraries); otherwise every read errors, so the
-- extension is only installed where it actually works.
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_stat_statements;
DO $$
BEGIN
  IF current_setting('shared_preload_libraries') ~ '(^|[ ,])pg_stat_statements($|[ ,])'
     AND EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_stat_statements') THEN
    CREATE EXTENSION pg_stat_statements SCHEMA extensions;
  END IF;
END $$;

DROP TABLE IF EXISTS playlist_tracks, playlists, order_items, orders, plays,
  customers, tracks, albums, genres, artists, type_edge_cases CASCADE;
DROP TYPE IF EXISTS order_status, edge_pair CASCADE;
DROP DOMAIN IF EXISTS positive_int CASCADE;
DROP FUNCTION IF EXISTS artist_play_count(int) CASCADE;
DROP FUNCTION IF EXISTS touch_updated_at() CASCADE;

CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'refunded');

CREATE TABLE artists (
  id         serial PRIMARY KEY,
  name       text NOT NULL UNIQUE,
  country    text,
  formed     int,
  meta       jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE genres (
  id   serial PRIMARY KEY,
  name text NOT NULL UNIQUE
);

CREATE TABLE albums (
  id         serial PRIMARY KEY,
  artist_id  int NOT NULL REFERENCES artists(id),
  title      text NOT NULL,
  released   int,
  price_cents int NOT NULL DEFAULT 1999
);

CREATE TABLE tracks (
  id          serial PRIMARY KEY,
  album_id    int NOT NULL REFERENCES albums(id),
  artist_id   int NOT NULL REFERENCES artists(id),
  genre_id    int REFERENCES genres(id),
  title       text NOT NULL,
  position    int NOT NULL,
  duration_ms int NOT NULL
);

CREATE TABLE customers (
  id         serial PRIMARY KEY,
  email      text NOT NULL UNIQUE,
  name       text NOT NULL,
  country    text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE plays (
  id          bigserial PRIMARY KEY,
  customer_id int NOT NULL REFERENCES customers(id),
  track_id    int NOT NULL REFERENCES tracks(id),
  played_at   timestamptz NOT NULL
);

CREATE TABLE orders (
  id          serial PRIMARY KEY,
  customer_id int NOT NULL REFERENCES customers(id),
  status      order_status NOT NULL DEFAULT 'pending',
  created_at  timestamptz NOT NULL
);

CREATE TABLE order_items (
  order_id    int NOT NULL REFERENCES orders(id),
  album_id    int NOT NULL REFERENCES albums(id),
  quantity    int NOT NULL DEFAULT 1,
  price_cents int NOT NULL,
  PRIMARY KEY (order_id, album_id)
);

CREATE TABLE playlists (
  id          serial PRIMARY KEY,
  customer_id int NOT NULL REFERENCES customers(id),
  name        text NOT NULL,
  is_public   boolean NOT NULL DEFAULT false
);

CREATE TABLE playlist_tracks (
  playlist_id int NOT NULL REFERENCES playlists(id),
  track_id    int NOT NULL REFERENCES tracks(id),
  position    int NOT NULL,
  PRIMARY KEY (playlist_id, track_id)
);

-- ── data ────────────────────────────────────────────────────
INSERT INTO genres (name) VALUES
  ('Jazz'), ('Soul'), ('Afrobeat'), ('Post-punk'), ('Electronic'),
  ('Krautrock'), ('Folk'), ('Hip hop'), ('Ambient'), ('Funk');

INSERT INTO artists (name, country, formed, meta) VALUES
  ('Nina Simone',     'US', 1954, '{"labels": ["Bethlehem", "Philips"], "instruments": ["piano", "vocals"]}'),
  ('Talking Heads',   'US', 1975, '{"labels": ["Sire"], "members": 4}'),
  ('Fela Kuti',       'NG', 1958, '{"labels": ["EMI Nigeria"], "band": "Africa 70"}'),
  ('Björk',           'IS', 1977, '{"labels": ["One Little Independent"]}'),
  ('Alice Coltrane',  'US', 1960, '{"instruments": ["harp", "piano", "organ"]}'),
  ('Stereolab',       'GB', 1990, '{"labels": ["Duophonic", "Warp"]}'),
  ('Can',             'DE', 1968, '{"labels": ["Spoon"], "members": 5}'),
  ('Joni Mitchell',   'CA', 1964, '{"labels": ["Reprise", "Asylum"]}'),
  ('A Tribe Called Quest', 'US', 1985, '{"labels": ["Jive"]}'),
  ('Brian Eno',       'GB', 1971, '{"labels": ["EG", "Obscure"]}'),
  ('Parliament',      'US', 1968, '{"labels": ["Casablanca"]}'),
  ('Kraftwerk',       'DE', 1970, '{"labels": ["Kling Klang"]}');

INSERT INTO albums (artist_id, title, released, price_cents) VALUES
  (1, 'Pastel Blues', 1965, 2199), (1, 'Wild Is the Wind', 1966, 1999),
  (2, 'Remain in Light', 1980, 2499), (2, 'Fear of Music', 1979, 2299),
  (3, 'Zombie', 1976, 2699), (3, 'Expensive Shit', 1975, 2499),
  (4, 'Homogenic', 1997, 2299), (4, 'Vespertine', 2001, 2299),
  (5, 'Journey in Satchidananda', 1971, 2799),
  (6, 'Emperor Tomato Ketchup', 1996, 2199), (6, 'Dots and Loops', 1997, 2199),
  (7, 'Tago Mago', 1971, 2599), (7, 'Ege Bamyasi', 1972, 2499),
  (8, 'Blue', 1971, 2399), (8, 'Hejira', 1976, 2299),
  (9, 'The Low End Theory', 1991, 2199), (9, 'Midnight Marauders', 1993, 2199),
  (10, 'Music for Airports', 1978, 1999), (10, 'Another Green World', 1975, 2099),
  (11, 'Mothership Connection', 1975, 2299),
  (12, 'Trans-Europe Express', 1977, 2399), (12, 'Computer World', 1981, 2299);

-- Ten tracks per album with plausible durations.
INSERT INTO tracks (album_id, artist_id, genre_id, title, position, duration_ms)
SELECT a.id, a.artist_id,
       (ARRAY[2,4,3,5,1,9,6,7,8,9,10,5])[a.artist_id],
       a.title || ' — track ' || p, p,
       150000 + ((a.id * 7919 + p * 104729) % 330000)
FROM albums a, generate_series(1, 10) p;

INSERT INTO customers (email, name, country, created_at)
SELECT 'listener' || i || '@example.com',
       (ARRAY['Ada','Grace','Linus','Margaret','Ken','Barbara','Dennis','Radia','Edsger','Frances'])[1 + i % 10]
         || ' ' || (ARRAY['Lovelace','Hopper','Torvalds','Hamilton','Thompson','Liskov','Ritchie','Perlman','Dijkstra','Allen'])[1 + (i / 10) % 10],
       (ARRAY['US','DE','GB','NG','IS','CA','FR','JP','BR','IN'])[1 + i % 10],
       now() - (i || ' hours')::interval
FROM generate_series(1, 2000) i;

-- Plays skewed toward the first artists so the "top artists" query is interesting.
INSERT INTO plays (customer_id, track_id, played_at)
SELECT 1 + (i * 7) % 2000,
       1 + (floor(power(random(), 2.2) * (SELECT count(*) FROM tracks)))::int,
       now() - (random() * interval '90 days')
FROM generate_series(1, 120000) i;

INSERT INTO orders (customer_id, status, created_at)
SELECT 1 + (i * 13) % 2000,
       (ARRAY['paid','paid','paid','shipped','shipped','pending','refunded']::order_status[])[1 + i % 7],
       now() - (random() * interval '180 days')
FROM generate_series(1, 6000) i;

INSERT INTO order_items (order_id, album_id, quantity, price_cents)
SELECT o.id, a.id, 1 + (o.id % 2), a.price_cents
FROM orders o
JOIN albums a ON a.id IN (1 + o.id % 22, 1 + (o.id * 5) % 22);

INSERT INTO playlists (customer_id, name, is_public)
SELECT 1 + i * 3, (ARRAY['Late night','Sunday cleaning','Deep focus','Road trip','Dinner party'])[1 + i % 5] || ' #' || i, i % 3 = 0
FROM generate_series(1, 300) i;

INSERT INTO playlist_tracks (playlist_id, track_id, position)
SELECT p.id, t.track_id, t.pos
FROM playlists p,
LATERAL (SELECT DISTINCT ON (tid) tid AS track_id, row_number() OVER () AS pos
         FROM (SELECT 1 + ((p.id * 31 + g * 17) % 220) AS tid FROM generate_series(1, 12) g) s) t;

-- ── indexes (one deliberately unused, for the Performance Advisor) ───
CREATE INDEX plays_track_id_idx    ON plays (track_id);
CREATE INDEX plays_played_at_idx   ON plays (played_at);
CREATE INDEX tracks_artist_id_idx  ON tracks (artist_id);
CREATE INDEX orders_customer_idx   ON orders (customer_id);
CREATE INDEX customers_country_idx ON customers (country);  -- unused
CREATE INDEX artists_meta_gin      ON artists USING gin (meta);

-- ── a function, a trigger, and RLS to explore ───────────────
CREATE FUNCTION artist_play_count(p_artist int) RETURNS bigint
LANGUAGE sql STABLE AS $$
  SELECT count(*) FROM plays p JOIN tracks t ON t.id = p.track_id WHERE t.artist_id = p_artist
$$;

CREATE FUNCTION touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER customers_touch BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_playlists_visible ON playlists FOR SELECT USING (is_public);

COMMENT ON TABLE plays IS 'One row per listen. 120k rows, skewed toward a few artists.';

-- ── type edge cases ─────────────────────────────────────────
-- One column per Postgres type, one row per scenario: values that don't map
-- cleanly to JSON / JavaScript (int8 beyond 2^53, NaN and Infinity, huge
-- numerics, bytea that isn't UTF-8, intervals, geometry, network types, json
-- with duplicate keys …). Kept on purpose whether or not the app handles them
-- yet; it's the fixture for testing how values are shown and sent back.
-- Two ids differ only past 2^53 (…992 and …993): in JS both become …992.
CREATE TYPE edge_pair AS (a int, b text);
CREATE DOMAIN positive_int AS int CHECK (VALUE > 0);

CREATE TABLE type_edge_cases (
  id               bigint PRIMARY KEY,
  label            text NOT NULL,
  c_int2           int2,
  c_int4           int4,
  c_int8           int8,
  c_numeric        numeric,
  c_numeric_scaled numeric(20,10),
  c_float4         float4,
  c_float8         float8,
  c_money          money,
  c_bool           bool,
  c_text           text,
  c_text_large     text,
  c_varchar        varchar(10),
  c_char           char(5),
  c_bytea          bytea,
  c_uuid           uuid,
  c_date           date,
  c_timestamp      timestamp,
  c_timestamptz    timestamptz,
  c_time           time,
  c_timetz         timetz,
  c_interval       interval,
  c_inet           inet,
  c_cidr           cidr,
  c_macaddr        macaddr,
  c_macaddr8       macaddr8,
  c_point          point,
  c_line           line,
  c_lseg           lseg,
  c_box            box,
  c_path           path,
  c_polygon        polygon,
  c_circle         circle,
  c_json           json,
  c_jsonb          jsonb,
  c_int_array      int[],
  c_text_array     text[],
  c_int_matrix     int[][],
  c_uuid_array     uuid[],
  c_int4range      int4range,
  c_numrange       numrange,
  c_tstzrange      tstzrange,
  c_bit            bit(8),
  c_varbit         varbit,
  c_tsvector       tsvector,
  c_tsquery        tsquery,
  c_pg_lsn         pg_lsn,
  c_oid            oid,
  c_regclass       regclass,
  c_enum           order_status,
  c_composite      edge_pair,
  c_domain         positive_int,
  "Mixed Case"     text,
  "with space"     text,
  "quote""d"       text
);

INSERT INTO type_edge_cases VALUES
(1, 'typical',
  42, 42, 42, 123.45, 3.1415926536, 1.5, 0.1, 1234.56, true,
  'Hello, world', NULL, 'short', 'ab', '\xdeadbeef', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '2024-02-29', '2024-02-29 13:45:30.123456', '2024-02-29 13:45:30.123456+01',
  '13:45:30.5', '13:45:30+05:30', '1 year 2 mons 3 days 04:05:06.789',
  '192.168.1.10', '10.0.0.0/8', '08:00:2b:01:02:03', '08:00:2b:01:02:03:04:05',
  '(1,2)', '{1,-1,0}', '[(0,0),(1,1)]', '((0,0),(2,3))', '[(0,0),(1,1),(2,0)]',
  '((0,0),(1,1),(2,0))', '<(0,0),5>',
  '{"b": 1, "a": 2}', '{"name": "Tuple", "tags": ["pg", "json"]}',
  '{1,2,3}', '{alpha,beta}', '{{1,2},{3,4}}',
  '{a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11,6ba7b810-9dad-11d1-80b4-00c04fd430c8}',
  '[1,10)', '[1.5,2.5]', '[2024-01-01,2025-01-01)',
  B'10101010', B'101', to_tsvector('english', 'The quick brown fox'), 'quick & fox',
  '16/B374D848', 1259, 'artists', 'paid', ROW(1, 'one'), 7,
  'Mixed', 'space', 'quoted'),

(2, 'minimums, negatives, empty',
  -32768, -2147483648, -9223372036854775808,
  -0.000000000000000000000000000001, -9999999999.9999999999,
  -3.4e38, -1.7976931348623157e308, -92233720368547758.08, false,
  '', NULL, '', '', '\x', '00000000-0000-0000-0000-000000000000',
  '4713-01-01 BC', '4713-01-01 00:00:00 BC', '4713-01-01 00:00:00+00 BC',
  '00:00:00', '00:00:00-15:59', '-1 year -2 mons +3 days -04:05:06',
  '::1', '::/0', '00:00:00:00:00:00', '00:00:00:00:00:00:00:00',
  '(-1.5,-2.5)', '{0,1,0}', '[(0,0),(0,0)]', '((0,0),(0,0))', '((0,0),(1,0),(1,1))',
  '((0,0))', '<(0,0),0>',
  '[]', '{}',
  '{}', '{}', '{}', '{}',
  'empty', '(,)', '(,)',
  B'00000000', B'', '', '!foo',
  '0/0', 0, 'pg_class', 'pending', ROW(NULL, NULL), 1,
  '', '', ''),

(9007199254740993, 'maximums, huge, unicode (id = 2^53 + 1)',
  32767, 2147483647, 9223372036854775807,
  123456789012345678901234567890.123456789012345678901234567890, 9999999999.9999999999,
  3.4028235e38, 1.7976931348623157e308, 92233720368547758.07, true,
  E'emoji 🐘👩‍💻 · combining é · RTL שלום مرحبا · zero-width [​] · tab\there · new\nline · quotes ''single'' "double" · backslash \\',
  repeat('pgquery ', 25000),  -- 200 KB
  'abcdefghij', '12345', '\x00ff80fe', 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  '5874897-12-31', '294276-12-31 23:59:59.999999', '294276-12-30 23:59:59.999999+00',
  '24:00:00', '24:00:00+15:59', '178000000 years 11 mons 30 days 23:59:59.999999',
  '2001:db8::1/64', '2001:db8::/32', 'ff:ff:ff:ff:ff:ff', 'ff:ff:ff:ff:ff:ff:ff:ff',
  '(1e308,-1e308)', '{1,1,1e300}', '[(-1e300,-1e300),(1e300,1e300)]',
  '((1e300,1e300),(-1e300,-1e300))', '((0,0),(0,1),(1,1),(1,0),(0.5,0.5))',
  '((0,0),(0,1),(1,1),(1,0),(0.5,0.5))', '<(1,1),1e300>',
  '{"z": 1, "a": 2, "a": 3, "big": 12345678901234567890, "precise": 0.1000000000000000055511151231257827, "deep": {"l1": {"l2": {"l3": {"l4": {"l5": [1, [2, [3]]]}}}}}}',
  '{"big": 12345678901234567890, "exp": 1e400, "tiny": 1e-400, "unicode": "é🐘"}',
  '{1,NULL,2147483647}', '{"a,b","with \"quote\"","{braces}",NULL,"NULL",""}',
  '{{1,2,3},{4,5,6},{7,8,9}}', '{ffffffff-ffff-ffff-ffff-ffffffffffff,NULL}',
  '[-2147483648,2147483647)', '[0,1e40)', '[-infinity,infinity]',
  B'11111111', repeat('10', 64)::varbit,
  to_tsvector('english', repeat('elephants remember every query ', 50)), '(cat | dog) & !rat <-> mouse',
  'FFFFFFFF/FFFFFFFF', 4294967295, 'type_edge_cases', 'refunded',
  ROW(2147483647, 'with, "comma" and (parens)'), 2147483647,
  'Ünïcödé', 'ﬁ ligature', '🐘'),

(9007199254740992, 'specials: NaN, infinity, JSON null (id = 2^53)',
  0, 0, 0, 'NaN', 'NaN', 'NaN', 'Infinity', 0, NULL,
  E'control chars: bell \x07 · esc \x1B[31mred\x1B[0m · CR \r · form feed \f', NULL, ' ', '     ', '\x00', NULL,
  'infinity', '-infinity', 'infinity',
  '23:59:59.999999', NULL, '0',
  '0.0.0.0', '0.0.0.0/0', NULL, NULL,
  '(NaN,Infinity)', NULL, NULL, NULL, NULL, NULL, '<(0,0),Infinity>',
  'null', '"just a string"',
  '{NULL}', '{NULL}', '{{NULL,NULL}}', '{NULL}',
  '(,5]', '[NaN,NaN]', '[infinity,infinity]',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL, NULL, NULL,
  NULL, NULL, NULL),

(9223372036854775807, 'negative specials: -Infinity, -0 (id = max int8)',
  -1, -1, -1, -0.0, -0.0000000001, '-0', '-Infinity', -0.01, false,
  'NULL', NULL, 'null', 'NULL', '\x0000', NULL,
  '-infinity', 'infinity', '-infinity',
  '00:00:00.000001', '12:00:00+00', '-0.000001 seconds',
  '255.255.255.255', '192.168.0.0/31', NULL, NULL,
  '(-0,-0)', NULL, NULL, NULL, NULL, NULL, '<(-Infinity,0),1>',
  '{"": "empty key", " ": "space key", "a.b": "dot key"}', '[1e-7, -0, 0.1, 1.0, 100]',
  NULL, '{"",NULL," "}', NULL, NULL,
  '[,)', '(-1e40,0]', '[-infinity,now)',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL, NULL, NULL,
  NULL, NULL, NULL),

(-9223372036854775808, 'all NULL (id = min int8)',
  NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL, NULL, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL, NULL, NULL,
  NULL, NULL, NULL);

-- Only on servers that support them, so the seed still runs everywhere:
-- numeric ±Infinity and multiranges (Postgres 14+), xml (needs libxml).
DO $$
BEGIN
  IF current_setting('server_version_num')::int >= 140000 THEN
    ALTER TABLE type_edge_cases ADD COLUMN c_int4multirange int4multirange;
    UPDATE type_edge_cases SET c_numeric = 'Infinity', c_int4multirange = '{[1,3), [5,8), [10,)}'
      WHERE id = 9007199254740992;
    UPDATE type_edge_cases SET c_numeric = '-Infinity', c_int4multirange = '{}'
      WHERE id = 9223372036854775807;
    UPDATE type_edge_cases SET c_int4multirange = '{[1,10)}' WHERE id = 1;
  END IF;
  BEGIN
    ALTER TABLE type_edge_cases ADD COLUMN c_xml xml;
    UPDATE type_edge_cases SET c_xml = '<track id="1"><title>Tuple &amp; friends</title></track>' WHERE id = 1;
    UPDATE type_edge_cases SET c_xml = 'just text, no root' WHERE id = 2;
  EXCEPTION WHEN feature_not_supported THEN
    ALTER TABLE type_edge_cases DROP COLUMN IF EXISTS c_xml;
  END;
END $$;

COMMENT ON TABLE type_edge_cases IS 'One column per Postgres type, one row per edge case (int8 past 2^53, NaN, Infinity, huge numerics, non-UTF-8 bytea, geometry …). A test fixture for how values are displayed.';

-- ── the read-only demo role ─────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'demo') THEN
    CREATE ROLE demo LOGIN;
  END IF;
END $$;

-- The password is set by the proxy right after this script (random per run).
ALTER ROLE demo WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION
  CONNECTION LIMIT 20;
ALTER ROLE demo SET default_transaction_read_only = on;
ALTER ROLE demo SET statement_timeout = '5s';
ALTER ROLE demo SET idle_in_transaction_session_timeout = '10s';
-- Let the advisors find pg_stat_statements without a schema prefix.
ALTER ROLE demo SET search_path = public, extensions;

-- Grants are the real guard: default_transaction_read_only is only a default
-- a session could change, so demo gets SELECT and nothing else.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
DO $$ BEGIN
  EXECUTE format('REVOKE TEMPORARY ON DATABASE %I FROM PUBLIC', current_database());
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO demo', current_database());
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM demo;
GRANT USAGE ON SCHEMA public, extensions TO demo;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO demo;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO demo;
GRANT SELECT ON ALL TABLES IN SCHEMA extensions TO demo;
GRANT pg_read_all_stats TO demo;   -- lets the advisors read pg_stat_* views
