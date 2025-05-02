select vault.create_secret('cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', '{"type":"postgres","host":"aws-0-us-east-1.pooler.supabase.com","port":5432,"username":"postgres.fjbidcbjvmpesoonimhl","password":"S8Jrts05EqxsfA3q","database":"postgres","schema":"sem","jump_host":null,"ssh_username":null,"ssh_private_key":null}')

--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000000', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'authenticated', 'authenticated', 'chad@buster.so', '$2a$06$BKy/23Yp58fItuTD0aKWluB2ayXyww8AeXNQ0KHgh9TeRxJ/tbmaC', '2025-03-04 18:42:05.801697+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2025-03-04 18:42:05.801697+00', '2025-03-04 18:42:05.801697+00', NULL, NULL, '', '', NULL, DEFAULT, '', 0, NULL, '', NULL, false, NULL, false);
INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000000', '1fe85021-e799-471b-8837-953e9ae06e4c', 'authenticated', 'authenticated', 'blake@buster.so', '$2a$06$TGfhnVxsa/Iy/rHmPnjiTuCMkui64yaAOEJl3qqaplGDrbUioCfPS', '2025-03-04 18:42:05.801697+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2025-03-04 18:42:05.801697+00', '2025-03-04 18:42:05.801697+00', NULL, NULL, '', '', NULL, DEFAULT, '', 0, NULL, '', NULL, false, NULL, false);
INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000000', '6840fa04-c0d7-4e0e-8d3d-ea9190d93874', 'authenticated', 'authenticated', 'nate@buster.so', '$2a$06$Qy7COradxcriaW2vMkfFce1GNSvt3NVq/7LI0bPid.rk.gMZ20Thi', '2025-03-04 18:42:05.801697+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2025-03-04 18:42:05.801697+00', '2025-03-04 18:42:05.801697+00', NULL, NULL, '', '', NULL, DEFAULT, '', 0, NULL, '', NULL, false, NULL, false);
INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000000', 'aa0a1367-3a10-4fe5-9244-2db46c000d64', 'authenticated', 'authenticated', 'dallin@buster.so', '$2a$06$jRwWRve7D0lnGhhjJ.r0uOpNlmP32LgNmWJmK5WjrjH0ys8HDHWEC', '2025-05-02 17:13:25.168157+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2025-05-02 17:13:25.157381+00', '2025-05-02 17:20:39.354945+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);
INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000000', '8e98a1fc-c4d5-401c-98d8-2cce60e11079', 'authenticated', 'authenticated', 'sales@buster.so', '$2a$06$S6iCGkSXOfl13SeSR1xjPemM7xB41aR.W6N0H3/kEPtYXM./PXpAC', '2025-05-02 17:32:18.687262+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2025-05-02 17:32:18.679118+00', '2025-05-02 17:36:12.648736+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);
INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000000', '70d05d4e-b2c1-40c5-be69-315e420fd0ab', 'authenticated', 'authenticated', 'noaccess@buster.so', '$2a$06$vJM/Dbp2AC/TXBCZiv8liu7JgC.1FxOlvV7kCOPVLjRm/RbtBDFje', '2025-05-02 17:37:28.23433+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2025-05-02 17:37:28.223148+00', '2025-05-02 17:37:46.204993+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO auth.identities VALUES ('c2dd64cd-f7f3-4884-bc91-d46ae431901e', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e', '{"sub": "c2dd64cd-f7f3-4884-bc91-d46ae431901e"}', 'email', '2025-03-04 18:42:05.81425+00', '2025-03-04 18:42:05.81425+00', '2025-03-04 18:42:05.81425+00', DEFAULT, 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
INSERT INTO auth.identities VALUES ('1fe85021-e799-471b-8837-953e9ae06e4c', '1fe85021-e799-471b-8837-953e9ae06e4c', '{"sub": "1fe85021-e799-471b-8837-953e9ae06e4c"}', 'email', '2025-03-04 18:42:05.81425+00', '2025-03-04 18:42:05.81425+00', '2025-03-04 18:42:05.81425+00', DEFAULT, '1fe85021-e799-471b-8837-953e9ae06e4c');
INSERT INTO auth.identities VALUES ('6840fa04-c0d7-4e0e-8d3d-ea9190d93874', '6840fa04-c0d7-4e0e-8d3d-ea9190d93874', '{"sub": "6840fa04-c0d7-4e0e-8d3d-ea9190d93874"}', 'email', '2025-03-04 18:42:05.81425+00', '2025-03-04 18:42:05.81425+00', '2025-03-04 18:42:05.81425+00', DEFAULT, '6840fa04-c0d7-4e0e-8d3d-ea9190d93874');
INSERT INTO auth.identities VALUES ('aa0a1367-3a10-4fe5-9244-2db46c000d64', 'aa0a1367-3a10-4fe5-9244-2db46c000d64', '{"sub": "aa0a1367-3a10-4fe5-9244-2db46c000d64"}', 'email', '2025-05-02 17:13:25.166879+00', '2025-05-02 17:13:25.166901+00', '2025-05-02 17:13:25.166901+00', DEFAULT, '6675f0b2-1fe4-4b13-926f-8a2e7279f5de');
INSERT INTO auth.identities VALUES ('8e98a1fc-c4d5-401c-98d8-2cce60e11079', '8e98a1fc-c4d5-401c-98d8-2cce60e11079', '{"sub": "8e98a1fc-c4d5-401c-98d8-2cce60e11079"}', 'email', '2025-05-02 17:32:18.686266+00', '2025-05-02 17:32:18.686291+00', '2025-05-02 17:32:18.686291+00', DEFAULT, 'b5dd5b27-3a7f-4872-b78e-a1b1cd716908');
INSERT INTO auth.identities VALUES ('70d05d4e-b2c1-40c5-be69-315e420fd0ab', '70d05d4e-b2c1-40c5-be69-315e420fd0ab', '{"sub": "70d05d4e-b2c1-40c5-be69-315e420fd0ab"}', 'email', '2025-05-02 17:37:28.23307+00', '2025-05-02 17:37:28.233085+00', '2025-05-02 17:37:28.233085+00', DEFAULT, '882b5c5b-01c8-47a4-897c-2bfb9d6a3f9c');


-- Update user names in public.users
UPDATE public.users SET name = 'chad' WHERE id = 'c2dd64cd-f7f3-4884-bc91-d46ae431901e';
UPDATE public.users SET name = 'blake' WHERE id = '1fe85021-e799-471b-8837-953e9ae06e4c';
UPDATE public.users SET name = 'nate' WHERE id = '6840fa04-c0d7-4e0e-8d3d-ea9190d93874';
UPDATE public.users SET name = 'dallin' WHERE id = 'aa0a1367-3a10-4fe5-9244-2db46c000d64';
UPDATE public.users SET name = 'sales' WHERE id = '8e98a1fc-c4d5-401c-98d8-2cce60e11079';
UPDATE public.users SET name = 'no access' WHERE id = '70d05d4e-b2c1-40c5-be69-315e420fd0ab';