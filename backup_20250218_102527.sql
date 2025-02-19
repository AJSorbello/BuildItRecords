--
-- PostgreSQL database dump
--

-- Dumped from database version 14.15 (Homebrew)
-- Dumped by pg_dump version 16.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: ajsorbello
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO ajsorbello;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: enum_releases_release_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_releases_release_type AS ENUM (
    'album',
    'single',
    'ep'
);


ALTER TYPE public.enum_releases_release_type OWNER TO postgres;

--
-- Name: enum_releases_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_releases_status AS ENUM (
    'draft',
    'scheduled',
    'published'
);


ALTER TYPE public.enum_releases_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Labels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Labels" (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    "spotifyPlaylistId" character varying(255),
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Labels" OWNER TO postgres;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO postgres;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.admin_users OWNER TO postgres;

--
-- Name: artists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.artists (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    spotify_id character varying(255),
    spotify_url character varying(255),
    image_url character varying(255),
    external_urls jsonb,
    label_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.artists OWNER TO postgres;

--
-- Name: labels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.labels (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    spotify_playlist_id character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.labels OWNER TO postgres;

--
-- Name: release_artists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.release_artists (
    release_id uuid NOT NULL,
    artist_id uuid NOT NULL,
    role character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.release_artists OWNER TO postgres;

--
-- Name: releases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.releases (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    spotify_id character varying(255),
    release_type public.enum_releases_release_type NOT NULL,
    release_date timestamp with time zone NOT NULL,
    artwork_url character varying(255),
    spotify_url character varying(255),
    external_urls jsonb,
    label_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.releases OWNER TO postgres;

--
-- Name: sequelize_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sequelize_data (
    name character varying(255) NOT NULL
);


ALTER TABLE public.sequelize_data OWNER TO postgres;

--
-- Name: sequelize_meta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sequelize_meta (
    name character varying(255) NOT NULL
);


ALTER TABLE public.sequelize_meta OWNER TO postgres;

--
-- Data for Name: Labels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Labels" (id, name, display_name, slug, description, "spotifyPlaylistId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SequelizeMeta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SequelizeMeta" (name) FROM stdin;
20240101000000-create-labels.js
\.


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_users (id, username, password_hash, is_admin, created_at, updated_at) FROM stdin;
f618124e-c89b-41b1-ba87-dacfaa974657	admin	$2b$10$x2PcH.vNOzBxImnjFZTdDu600CeKhbPba4lXwcFgecIhshsZ1q.QG	t	2025-02-17 17:32:35.525-08	2025-02-17 17:32:35.525-08
\.


--
-- Data for Name: artists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.artists (id, name, spotify_id, spotify_url, image_url, external_urls, label_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: labels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.labels (id, name, display_name, slug, description, spotify_playlist_id, created_at, updated_at) FROM stdin;
ca2f1560-bc81-448d-b003-c2f8c79ef9e3	Build It Records	Build It Records	buildit-records	The main record label for Build It Records, focusing on mainstream electronic music.	\N	2025-02-17 17:39:06.942-08	2025-02-17 17:39:06.942-08
757774bc-cb6f-4333-bf21-f7826890f203	Build It Tech	Build It Tech	buildit-tech	The tech house and techno division of Build It Records.	\N	2025-02-17 17:39:06.942-08	2025-02-17 17:39:06.942-08
891ff019-b155-4513-8178-946c983283e6	Build It Deep	Build It Deep	buildit-deep	The deep house and melodic house division of Build It Records.	\N	2025-02-17 17:39:06.942-08	2025-02-17 17:39:06.942-08
\.


--
-- Data for Name: release_artists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.release_artists (release_id, artist_id, role, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: releases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.releases (id, name, spotify_id, release_type, release_date, artwork_url, spotify_url, external_urls, label_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sequelize_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sequelize_data (name) FROM stdin;
20250217_seed_labels.js
\.


--
-- Data for Name: sequelize_meta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sequelize_meta (name) FROM stdin;
001_create_admin_users.js
20250215_init.js
\.


--
-- Name: Labels Labels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Labels"
    ADD CONSTRAINT "Labels_pkey" PRIMARY KEY (id);


--
-- Name: Labels Labels_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Labels"
    ADD CONSTRAINT "Labels_slug_key" UNIQUE (slug);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_username_key UNIQUE (username);


--
-- Name: artists artists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artists
    ADD CONSTRAINT artists_pkey PRIMARY KEY (id);


--
-- Name: artists artists_spotify_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artists
    ADD CONSTRAINT artists_spotify_id_key UNIQUE (spotify_id);


--
-- Name: labels labels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labels
    ADD CONSTRAINT labels_pkey PRIMARY KEY (id);


--
-- Name: labels labels_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labels
    ADD CONSTRAINT labels_slug_key UNIQUE (slug);


--
-- Name: release_artists release_artists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.release_artists
    ADD CONSTRAINT release_artists_pkey PRIMARY KEY (release_id, artist_id);


--
-- Name: releases releases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.releases
    ADD CONSTRAINT releases_pkey PRIMARY KEY (id);


--
-- Name: releases releases_spotify_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.releases
    ADD CONSTRAINT releases_spotify_id_key UNIQUE (spotify_id);


--
-- Name: sequelize_data sequelize_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sequelize_data
    ADD CONSTRAINT sequelize_data_pkey PRIMARY KEY (name);


--
-- Name: sequelize_meta sequelize_meta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sequelize_meta
    ADD CONSTRAINT sequelize_meta_pkey PRIMARY KEY (name);


--
-- Name: artists_label_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX artists_label_id ON public.artists USING btree (label_id);


--
-- Name: artists_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX artists_name ON public.artists USING btree (name);


--
-- Name: artists_spotify_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX artists_spotify_id ON public.artists USING btree (spotify_id);


--
-- Name: labels_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX labels_slug ON public.labels USING btree (slug);


--
-- Name: release_artists_artist_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX release_artists_artist_id ON public.release_artists USING btree (artist_id);


--
-- Name: release_artists_release_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX release_artists_release_id ON public.release_artists USING btree (release_id);


--
-- Name: release_artists_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX release_artists_role ON public.release_artists USING btree (role);


--
-- Name: releases_label_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX releases_label_id ON public.releases USING btree (label_id);


--
-- Name: releases_release_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX releases_release_date ON public.releases USING btree (release_date);


--
-- Name: releases_spotify_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX releases_spotify_id ON public.releases USING btree (spotify_id);


--
-- Name: artists artists_label_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artists
    ADD CONSTRAINT artists_label_id_fkey FOREIGN KEY (label_id) REFERENCES public.labels(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: release_artists release_artists_artist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.release_artists
    ADD CONSTRAINT release_artists_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: release_artists release_artists_release_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.release_artists
    ADD CONSTRAINT release_artists_release_id_fkey FOREIGN KEY (release_id) REFERENCES public.releases(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: releases releases_label_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.releases
    ADD CONSTRAINT releases_label_id_fkey FOREIGN KEY (label_id) REFERENCES public.labels(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: ajsorbello
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

