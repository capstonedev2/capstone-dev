SET session_replication_role = 'replica';
--
-- PostgreSQL database dump
--

\restrict 984XEjW3kAcWaQg53da92O82m4Wai9cCvgLaDXAlIvfIJLpRDaXV7gdKp0qOc5l

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: AcademicYear; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Group; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Group" (id, "userId", "projectId", status, "createdAt", "updatedAt", code, title, "projectTitle", dept, department, members, students, progress, "statusLabel", "statusClass", "lifecycleStatus", milestone, "currentMilestone", leader, "finalDefenseResult", "finalManuscriptApproved", "allRequiredMilestonesCompleted", "completedAt", "finalScore", "finalRecommendation", "allowMemberSubmission") VALUES ('cmr8ueftu0000rorv0g4p47ya', 'cmpwa68jr0003morvzm99ssoc', 'cmrg4yiru0008ecrvnj1vgjhm', 'pending', '2026-07-06 06:32:04.77', '2026-07-11 10:48:31.443', 'IT-2026-01', 'Pending Title Approval', '', 'ICT', 'ICT', 4, '{"Kyle Graniten","James Juntilla","Camille Achas","Ivy Bitos"}', 0, 'Pending', 'status-pending', 'pending', 'Awaiting initial progress update', 'Awaiting initial progress update', 'Kyle Graniten', 'Pending', false, false, NULL, NULL, NULL, false);
INSERT INTO public."Group" (id, "userId", "projectId", status, "createdAt", "updatedAt", code, title, "projectTitle", dept, department, members, students, progress, "statusLabel", "statusClass", "lifecycleStatus", milestone, "currentMilestone", leader, "finalDefenseResult", "finalManuscriptApproved", "allRequiredMilestonesCompleted", "completedAt", "finalScore", "finalRecommendation", "allowMemberSubmission") VALUES ('cmrg4ie240004ecrvvkzw2gtt', 'cmpwa68jr0003morvzm99ssoc', 'project-1783759768364', 'pending', '2026-07-11 08:49:28.492', '2026-07-11 09:32:56.993', 'IT-2026-02', 'Pending Student Submission', 'Pending Student Submission', 'ICT', 'ICT', 3, '{"Juan Dela Cruz","student account","dominic gara mara"}', 0, 'Pending', 'status-pending', 'pending', 'Awaiting initial progress update', 'Awaiting initial progress update', 'Juan Dela Cruz', 'Pending', false, false, NULL, NULL, NULL, false);


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('cmrg4e1780003ecrv4ggjez4y', 'student.account@gmail.com', '$2b$12$oaMcfBm3i40nT0/c8deIj.GUvZDB/Zfdgn0x.njD0jEmPZw28tj7W', 'student account', 'student', 'account', '2025002', 'BSIT', '4', 'student', '2026-07-11 08:46:05.204', '2026-07-11 08:46:05.204', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '82ade77d-eee7-4e0a-995c-3997ebfaf8cc');
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('b52cdfb3-9031-47a8-809f-489435db80c9', 'admin@thesistrack.edu', '$2b$12$h3PqgaGkFoJeeHnNRiq6cOfuM.JltsOxaPYdI4neCLVebXsPV7rR6', 'System Admin', 'System', 'Admin', NULL, NULL, NULL, 'system_admin', '2026-06-02 00:36:18.761', '2026-06-03 05:57:53.352', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '68867f70-631a-4b75-9c1c-d4ef1a6db8cf');
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('cmpwa4kzs0002morvccih18mo', 'research.head@edu.com', '$2b$12$T2/Vn8sL3Vilh.pFbeKn1ewtLMUHNz.PJprdkXwIBNp5cypQ9Xn/G', 'Resaerch Head', 'Resaerch', 'Head', NULL, 'Research Office', NULL, 'research_head', '2026-06-02 06:51:36.136', '2026-06-03 06:08:01.097', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '98082791-743d-4245-ae85-aaf6cbdb36d2');
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('cmpwa3dkr0001morvf2oo60ak', 'industry.partner@gamil.com', '$2b$12$NkW9BJjcTr0K0i1WIm2YYe8musAv0Fpow0PdJ9d3.VhwJGsQFJUHW', 'industry partner', 'industry', 'partner', NULL, 'Thesis Corp.', NULL, 'partner', '2026-06-02 06:50:39.867', '2026-06-03 06:55:12.78', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '5e569c80-9c39-4891-82ce-ce3ac0ac311e');
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('cmpwa2bde0000morvf1vthki7', 'library@edu.com', '$2b$12$1Vo7NZXuozkY7zGTM7qBheEKCYTSl0PAKMYl7BVAcaVcz1B1c93iW', 'library user', 'library', 'user', NULL, 'Library', NULL, 'library', '2026-06-02 06:49:50.354', '2026-06-03 07:29:07.235', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'c0d38121-dba0-4167-b2ba-5585b6b802bc');
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('cmphspg1u0001owrv001nuy2z', 'it.adviser@gmail.com', '$2b$12$zPzdZ1cgTcmzsS1O2vKsRO3kQFDCTAY3LdOky9vQArUdpfBNE4d02', 'IT Adviser', 'IT', 'Adviser', NULL, 'BSIT', NULL, 'adviser', '2026-05-23 03:35:09.954', '2026-06-03 09:26:37.427', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '6e1ec527-3b20-4cab-a208-9ba04e6400e6');
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('cmpy1u3mq00028wrvlqy6i7uj', 'capstonedev2@gmail.com', '$2b$12$tODJljCIZW4t.4m6mQiBYOlga9BLgJNGMpHVqvKCfaWvD6lK16GVS', 'Kyle Graniten', 'Kyle', 'Graniten', NULL, 'ICT', NULL, 'adviser', '2026-06-03 12:35:02.498', '2026-06-03 12:41:04.905', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '136e1629-24d3-45dd-a54a-7023f39070c1', NULL, '136e1629-24d3-45dd-a54a-7023f39070c1');
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('cmrg5r68c000a48rv1pjfg1q8', 'dominic@gmail.com', '$2b$12$g0NTfN3KFLPpJ.XonrCYBOAzAjR0gHg3Ug8s4gML7pHp3jbN57eQ2', 'dominic gara mara', 'dominic', 'gara mara', '2026003', 'BSIT', '3', 'student', '2026-07-11 09:24:17.868', '2026-07-11 09:24:17.868', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'd26905b7-0d51-437c-8ab0-d9d65f3ff344');
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('cmqdfpdyx0003lorv07mqalav', 'kingong2704@gmail.com', '$2b$12$EfAcQSLgS67kJZCThmXzf.vrewFPiGmoOjb.F3GMi7jdKOqWfmOSe', 'Test Adviser', 'Test', 'Adviser', NULL, 'ICT', NULL, 'adviser', '2026-06-14 06:59:49.881', '2026-06-14 08:04:27.866', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '8384930e-012f-484b-8bc2-51fd28217364', NULL, '8384930e-012f-484b-8bc2-51fd28217364');
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('cmphsfoon0000owrvx3vg6yxr', 'kylecagadas27@gmail.com', '$2b$12$sL94rTGaBCFag3Lor.oL9ubOiCV0SY/Fa8hxPjJXQUdsATMykepIa', 'Kyle Graniten', 'Kyle', 'Graniten', '2023303723', 'BSIT', '3', 'student', '2026-05-23 03:27:34.583', '2026-06-20 04:10:30.605', false, NULL, NULL, NULL, NULL, 'https://res.cloudinary.com/dqlajypop/image/upload/v1781328114/thesistrack/profiles/file_oot0of.png', NULL, NULL, NULL, 'Kyle Graniten', '107497018626706564623', NULL, 'c3a010c6-fd3e-401a-bfe6-d778bb3ef27b');
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('cmpwa68jr0003morvzm99ssoc', 'department.chair@it.com', '$2b$12$zw4htElrVDma7iODIVgvreUIrnlZKr0clDpBJEfoitgnsamffQ9re', 'Jimvy P.Salise', 'department', 'chair', NULL, 'ICT', NULL, 'program_head', '2026-06-02 06:52:53.319', '2026-07-06 06:11:47.701', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'a73208f1-2369-455e-ad6e-fa7fc126b250');
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('cmrg5sb8h000b48rvxvl49923', 'aniluv.villamor@gmail.com', '$2b$12$gz69cnLL8lJeFoaq8vqosO0Hg5K.3qc7zjfeq01Rys8OioeD5gcs6', 'aniluv villamor', 'aniluv', 'villamor', '2026004', 'BSTCM', '3', 'student', '2026-07-11 09:25:11.009', '2026-07-11 09:25:11.009', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '15f4da10-e048-42e3-b7df-227ddba0172b');
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('cmrg5ve66000c48rvre09vqv4', 'cardo.dalisay@gmail.com', '$2b$12$3Zu87h.fqNxoluq/ruWLreUYmZGfSKHnQpTCrhui7eJ/km9c/8Wpi', 'Cardo Dalisay', 'Cardo', 'Dalisay', NULL, 'TCM Office', NULL, 'program_head', '2026-07-11 09:27:34.782', '2026-07-11 09:27:40.427', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'f4eb7e80-bfe6-44ae-8426-6e59a5f33976');
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('cmr8v2fvs0001rorv3k4ksmgz', 'ivy.bitos@gmail.com', '$2b$12$KbGHuU5Y60VGaT8DAg63Aew5/L8g3oyTqy11v7NkrOPml7kyRA1Em', 'Ivy Bitos', 'Ivy', 'Bitos', '20260001', 'BSIT', '4', 'student', '2026-07-06 06:50:44.585', '2026-07-06 07:00:39.238', false, NULL, NULL, NULL, NULL, 'https://res.cloudinary.com/dqlajypop/image/upload/v1783321238/thesistrack/profiles/file_vpsykb.png', NULL, NULL, NULL, 'Ivy Bitos', NULL, NULL, 'a9e65f5e-b72f-483c-b9d4-8c1f45af855e');
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('cmrono4p20000v0rvl6umfdkp', 'tcm.adviser@gmail.com', '$2b$12$esQ2xj/Z6M1s0OkzSqW4seUk14XJOgFVAugOMu8fxVp4y1aBHlJxG', 'TCM Adviser', 'TCM', 'Adviser', NULL, 'TCM Office', NULL, 'adviser', '2026-07-17 08:07:58.406', '2026-07-17 08:08:04.265', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '9dc6c7de-5abd-4c51-a388-974e90178644');
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('cmphuno330000ocrveujrja09', 'jame.juntilla@gmail.com', '$2b$12$Ojn6UAhrZ5kGeQIAlkPbAO9Z0DEMzbgKRkJbBx.ubVuu1CI2Shx6q', 'James Juntilla', 'IT', 'Student', '2026001', 'BSIT', '3', 'student', '2026-05-23 04:29:46.287', '2026-07-06 07:01:19.518', false, NULL, NULL, NULL, NULL, 'https://res.cloudinary.com/dqlajypop/image/upload/v1783321260/thesistrack/profiles/file_u3cynk.png', NULL, NULL, NULL, 'James Anthony Juntilla', NULL, NULL, '13177a84-7f03-43a0-8a2d-e0ff56f2046a');
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('cmrg4bve70002ecrvko0rvxq7', 'juan.delacruz@gmail.com', '$2b$12$HQzDRIQzyMDfufOWCyDzQeMsePoKs5IEa1ukxMr0SpfQKrwfLMwp6', 'Juan Dela Cruz', 'Juan', 'Dela Cruz', '2025001', 'BSIT', '4th Year', 'student', '2026-07-11 08:44:24.368', '2026-07-11 10:12:15.408', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Juan Cruz', NULL, NULL, 'fc967dda-ec3a-490c-b9a6-94491248d2c8');
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('cmrg7nd5q0004n4rvtdmk802m', 'achas.princess04@gmail.com', '$2b$12$BiEX5We3PULa5KQ25fhTguk1EFXq7NJHhFXz9TSVzTEu8h6LacAUS', 'Camille Achas', 'Camille', 'Achas', '2026005', 'BSIT', '4', 'student', '2026-07-11 10:17:19.454', '2026-07-11 10:17:19.454', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1a53e4a6-5740-45c8-89e8-7a4e407eb532');
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('a9a42db3-a56c-47f1-a47c-efa7179e9e83', 'adviser.met@example.com', '$2b$12$uguoyvhuLLviGp3hK05lBODmFKNjs7KunKwq7tsb454NDl73A5OeS', 'MET Adviser', 'MET', 'Adviser', NULL, 'MET', NULL, 'adviser', '2026-07-17 15:56:49.306', '2026-07-17 15:56:49.306', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('26b884d5-8515-4f3a-b807-50a32e04d253', 'adviser.tcm@example.com', '$2b$12$4OYuybbBMI4gg077kFf0nuqDT8NHYbhVWmYXNfiTLBI8GaySEVfPi', 'TCM Adviser', 'TCM', 'Adviser', NULL, 'TCM', NULL, 'adviser', '2026-07-17 15:57:23.186', '2026-07-17 15:57:23.186', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('8a08c7c0-dcf1-46ea-abdd-9535ca14f177', 'adviser.esm@example.com', '$2b$12$wmGlIcB6DBHBH83ilgOiguHCopQHrrldQ2p6/mct77rn1nCWmW/tO', 'ESM Adviser', 'ESM', 'Adviser', NULL, 'ESM', NULL, 'adviser', '2026-07-17 15:57:23.727', '2026-07-17 15:57:23.727', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('36fdab59-4cef-4580-8556-9b845453b04f', 'adviser.name@example.com', '$2b$12$vqJSFkfidZtX8TdyH9x/Ye69YkliNAL9Raha2Gh64CCreeBxE9fPi', 'NAME Adviser', 'NAME', 'Adviser', NULL, 'NAME', NULL, 'adviser', '2026-07-17 15:57:24.162', '2026-07-17 15:57:24.162', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('8e13a7b1-5e4c-4cd5-a468-e42c6f645df0', 'student.tcm1@example.com', '$2b$12$X2gmFGYFOS..ZCV1KYQJGuj8uvyHgi1yx.Rd9NMzI0usqLhQFUpvi', 'TCM Student1', 'TCM', 'Student1', 'TCM-001', 'TCM', '4', 'student', '2026-07-17 16:11:00.63', '2026-07-17 16:11:00.63', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('082eeba1-2110-4c58-9d19-ac4bc02c9125', 'student.tcm2@example.com', '$2b$12$ZH75pDxeUSQsYnKd3yWrx.xLek9UzXrELbpP53bIV/djhSYGS4z2y', 'TCM Student2', 'TCM', 'Student2', 'TCM-002', 'TCM', '4', 'student', '2026-07-17 16:11:01.047', '2026-07-17 16:11:01.047', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public."User" (id, email, "passwordHash", name, "firstName", "lastName", "studentId", department, "yearLevel", role, "createdAt", "updatedAt", "isSuspended", "suspendedAt", "contactNumber", address, "birthDate", "profileImage", section, "accountSummary", office, "displayName", "googleSub", "suspendedUntil", "supabaseId") VALUES ('cmroovt4a0000zgrvk82685w3', 'student.tcm1@gmail.com', '$2b$12$kkxykV.0hu2IsFsOgCTxj.g9NaFYjRqU5UB7b8N5s5UyXfx2D2Lxm', 'student TCM', 'student', 'TCM', '12345678', 'BSTCM', '3', 'student', '2026-07-17 08:41:56.266', '2026-07-17 08:41:56.266', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '4516a505-fb70-4f12-baba-c015e37de7f6');


--
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: AdviserScheduleItem; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."AuditLog" (id, "actorId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") VALUES ('cmrrihu440001egrv4unertsx', 'b52cdfb3-9031-47a8-809f-489435db80c9', 'system_branding.updated', 'SystemSetting', 'cmrrihu3l0000egrvtzr027uf', '{"key": "system.themeBranding", "systemName": "Thesis Track", "themePreset": "academic-blue"}', NULL, NULL, '2026-07-19 08:06:25.204');
INSERT INTO public."AuditLog" (id, "actorId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") VALUES ('cmrrl2la80003egrvegxcvvbb', 'b52cdfb3-9031-47a8-809f-489435db80c9', 'system_branding.updated', 'SystemSetting', 'cmrrihu3l0000egrvtzr027uf', '{"key": "system.themeBranding", "systemName": "Thesis Track", "themePreset": "academic-blue"}', NULL, NULL, '2026-07-19 09:18:32.768');
INSERT INTO public."AuditLog" (id, "actorId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") VALUES ('cms4au13h0001f0rvfal9iqq3', 'b52cdfb3-9031-47a8-809f-489435db80c9', 'system_branding.updated', 'SystemSetting', 'cmrrihu3l0000egrvtzr027uf', '{"key": "system.themeBranding", "systemName": "Thesis Track", "themePreset": "academic-blue"}', NULL, NULL, '2026-07-28 06:52:57.485');
INSERT INTO public."AuditLog" (id, "actorId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") VALUES ('cms4avcvs0003f0rvizhcpt6l', 'b52cdfb3-9031-47a8-809f-489435db80c9', 'system_branding.updated', 'SystemSetting', 'cmrrihu3l0000egrvtzr027uf', '{"key": "system.themeBranding", "systemName": "Thesis Track", "themePreset": "academic-blue"}', NULL, NULL, '2026-07-28 06:53:59.416');
INSERT INTO public."AuditLog" (id, "actorId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") VALUES ('cms4bef1a0005f0rvzoam7vgd', 'b52cdfb3-9031-47a8-809f-489435db80c9', 'system_branding.updated', 'SystemSetting', 'cmrrihu3l0000egrvtzr027uf', '{"key": "system.themeBranding", "systemName": "Thesis Track", "themePreset": "academic-blue"}', NULL, NULL, '2026-07-28 07:08:48.67');
INSERT INTO public."AuditLog" (id, "actorId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") VALUES ('cms4beyka0007f0rvfu0pqzm9', 'b52cdfb3-9031-47a8-809f-489435db80c9', 'system_branding.updated', 'SystemSetting', 'cmrrihu3l0000egrvtzr027uf', '{"key": "system.themeBranding", "systemName": "Thesis Track", "themePreset": "academic-blue"}', NULL, NULL, '2026-07-28 07:09:13.978');
INSERT INTO public."AuditLog" (id, "actorId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") VALUES ('cms4bflts0009f0rv53gbgby4', 'b52cdfb3-9031-47a8-809f-489435db80c9', 'system_branding.updated', 'SystemSetting', 'cmrrihu3l0000egrvtzr027uf', '{"key": "system.themeBranding", "systemName": "Thesis Track", "themePreset": "academic-blue"}', NULL, NULL, '2026-07-28 07:09:44.128');
INSERT INTO public."AuditLog" (id, "actorId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") VALUES ('cmsbhk9tm0001k8rvsg1ko48t', 'b52cdfb3-9031-47a8-809f-489435db80c9', 'system_branding.updated', 'SystemSetting', 'cmrrihu3l0000egrvtzr027uf', '{"key": "system.themeBranding", "systemName": "Thesis Track", "themePreset": "academic-blue"}', NULL, NULL, '2026-08-02 07:35:42.778');
INSERT INTO public."AuditLog" (id, "actorId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") VALUES ('cmsbhswi90001ekrvpzoordq0', 'b52cdfb3-9031-47a8-809f-489435db80c9', 'system_branding.updated', 'SystemSetting', 'cmrrihu3l0000egrvtzr027uf', '{"key": "system.themeBranding", "systemName": "Thesis Track", "themePreset": "academic-blue"}', NULL, NULL, '2026-08-02 07:42:25.425');
INSERT INTO public."AuditLog" (id, "actorId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") VALUES ('cmsbhufj20003ekrv4d06m3yi', 'b52cdfb3-9031-47a8-809f-489435db80c9', 'system_branding.updated', 'SystemSetting', 'cmrrihu3l0000egrvtzr027uf', '{"key": "system.themeBranding", "systemName": "Thesis Track", "themePreset": "academic-blue"}', NULL, NULL, '2026-08-02 07:43:36.734');
INSERT INTO public."AuditLog" (id, "actorId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") VALUES ('cmsbm4sal0001xorvc19huki7', 'b52cdfb3-9031-47a8-809f-489435db80c9', 'system_branding.updated', 'SystemSetting', 'cmrrihu3l0000egrvtzr027uf', '{"key": "system.themeBranding", "systemName": "Thesis Track", "themePreset": "academic-blue"}', NULL, NULL, '2026-08-02 09:43:38.301');
INSERT INTO public."AuditLog" (id, "actorId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") VALUES ('cmsbm9tqi0003xorvt4yg71h3', 'b52cdfb3-9031-47a8-809f-489435db80c9', 'system_branding.updated', 'SystemSetting', 'cmrrihu3l0000egrvtzr027uf', '{"key": "system.themeBranding", "systemName": "Thesis Track", "themePreset": "academic-blue"}', NULL, NULL, '2026-08-02 09:47:33.45');
INSERT INTO public."AuditLog" (id, "actorId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") VALUES ('cmsbmafwo0005xorvowwutlju', 'b52cdfb3-9031-47a8-809f-489435db80c9', 'system_branding.updated', 'SystemSetting', 'cmrrihu3l0000egrvtzr027uf', '{"key": "system.themeBranding", "systemName": "Thesis Track", "themePreset": "academic-blue"}', NULL, NULL, '2026-08-02 09:48:02.184');
INSERT INTO public."AuditLog" (id, "actorId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") VALUES ('cmsbmg5970007xorv7x95n1ho', 'b52cdfb3-9031-47a8-809f-489435db80c9', 'system_branding.updated', 'SystemSetting', 'cmrrihu3l0000egrvtzr027uf', '{"key": "system.themeBranding", "systemName": "Thesis Track", "themePreset": "academic-blue"}', NULL, NULL, '2026-08-02 09:52:28.315');


--
-- Data for Name: BrandingAsset; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: DefenseSchedule; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Evaluation; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: GroupMember; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."GroupMember" (id, "groupId", "userId", role, "joinedAt", "leftAt", "isActive", "createdAt", "updatedAt") VALUES ('cmrg62asj000d48rvmm69z8if', 'cmrg4ie240004ecrvvkzw2gtt', 'cmrg4bve70002ecrvko0rvxq7', 'member', '2026-07-11 09:32:56.993', NULL, true, '2026-07-11 09:32:56.993', '2026-07-11 09:32:56.993');
INSERT INTO public."GroupMember" (id, "groupId", "userId", role, "joinedAt", "leftAt", "isActive", "createdAt", "updatedAt") VALUES ('cmrg62asj000e48rva9itl8gn', 'cmrg4ie240004ecrvvkzw2gtt', 'cmrg4e1780003ecrv4ggjez4y', 'member', '2026-07-11 09:32:56.993', NULL, true, '2026-07-11 09:32:56.993', '2026-07-11 09:32:56.993');
INSERT INTO public."GroupMember" (id, "groupId", "userId", role, "joinedAt", "leftAt", "isActive", "createdAt", "updatedAt") VALUES ('cmrg62asj000f48rvbmscrwbd', 'cmrg4ie240004ecrvvkzw2gtt', 'cmrg5r68c000a48rv1pjfg1q8', 'member', '2026-07-11 09:32:56.993', NULL, true, '2026-07-11 09:32:56.993', '2026-07-11 09:32:56.993');
INSERT INTO public."GroupMember" (id, "groupId", "userId", role, "joinedAt", "leftAt", "isActive", "createdAt", "updatedAt") VALUES ('cmrg7qe3a0008n4rvxxwnucn1', 'cmr8ueftu0000rorv0g4p47ya', 'cmphsfoon0000owrvx3vg6yxr', 'member', '2026-07-11 10:19:40.629', NULL, true, '2026-07-11 10:19:40.629', '2026-07-11 10:19:40.629');
INSERT INTO public."GroupMember" (id, "groupId", "userId", role, "joinedAt", "leftAt", "isActive", "createdAt", "updatedAt") VALUES ('cmrg7qe3a0009n4rvo8krkph3', 'cmr8ueftu0000rorv0g4p47ya', 'cmphuno330000ocrveujrja09', 'member', '2026-07-11 10:19:40.629', NULL, true, '2026-07-11 10:19:40.629', '2026-07-11 10:19:40.629');
INSERT INTO public."GroupMember" (id, "groupId", "userId", role, "joinedAt", "leftAt", "isActive", "createdAt", "updatedAt") VALUES ('cmrg7qe3a000an4rvxd70ovm0', 'cmr8ueftu0000rorv0g4p47ya', 'cmrg7nd5q0004n4rvtdmk802m', 'member', '2026-07-11 10:19:40.629', NULL, true, '2026-07-11 10:19:40.629', '2026-07-11 10:19:40.629');
INSERT INTO public."GroupMember" (id, "groupId", "userId", role, "joinedAt", "leftAt", "isActive", "createdAt", "updatedAt") VALUES ('cmrg7qe3a000bn4rvjsuf8sd3', 'cmr8ueftu0000rorv0g4p47ya', 'cmr8v2fvs0001rorv3k4ksmgz', 'member', '2026-07-11 10:19:40.629', NULL, true, '2026-07-11 10:19:40.629', '2026-07-11 10:19:40.629');


--
-- Data for Name: IndustryPartner; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: IndustryProject; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ImpactFeedback; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Milestone; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: MilestoneCheckpoint; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: PasswordResetToken; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Submission; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ReviewComment; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: SystemSetting; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."SystemSetting" (id, key, value, scope, description, "createdAt", "updatedAt") VALUES ('cmrrihu3l0000egrvtzr027uf', 'system.themeBranding', '{"auth": {"login": {"pill": "Account Access", "title": "Welcome back", "subtitle": "Sign in to continue managing thesis submissions, reviews, and academic records.", "googleLabel": "Continue with Google", "submitLabel": "Sign in", "passwordLabel": "Password", "alternatePrompt": "New student account?", "identifierLabel": "Student ID / Email", "alternateLinkLabel": "Register here", "passwordPlaceholder": "Enter your password", "identifierPlaceholder": "e.g. 2021-00123 or user@university.edu.ph"}, "register": {"pill": "Student Account Setup", "title": "Student Registration", "subtitle": "Use your official academic details so the research office can prepare your ThesisTrack workspace.", "staffNote": "Faculty, staff, and office accounts are issued by the school.", "submitLabel": "Register Student Account", "academicNote": "Student access only.", "alternatePrompt": "Already have an account?", "alternateLinkLabel": "Sign in here"}}, "shell": {"navbarTitle": "Thesis Track", "sidebarBadge": "Super Admin", "sidebarTitle": "System Admin", "sidebarKicker": "Technical Control", "navbarSubtitle": "Higher Education Institutions", "sidebarDescription": "Platform configuration, security, backups, and access control"}, "assets": {"favicon": "/System%20Logo/logo-transparent.png", "darkLogo": "/System%20Logo/logo-transparent.png", "mainLogo": "/System%20Logo/logo-transparent.png", "lightLogo": "/System%20Logo/logo-transparent.png", "institutionLogo": "/System%20Logo/ustp-logo.png", "loginBackground": "/System%20Logo/campus.png", "registerBackground": "/System%20Logo/campus.png"}, "colors": {"info": "#2563EB", "error": "#DC2626", "accent": "#F6BE00", "border": "#E5E7EB", "navbar": "#FFFFFF", "primary": "#003A8F", "sidebar": "#0F3B82", "success": "#16A34A", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#1E40AF", "background": "#F8FAFC", "textPrimary": "#111827", "textSecondary": "#64748B"}, "landing": {"features": [{"id": "secure", "icon": "fa-shield-halved", "title": "Secure and Reliable", "visible": true, "description": "Protected access for academic users, records, and project files."}, {"id": "workflow", "icon": "fa-diagram-project", "title": "Integrated Workflow", "visible": true, "description": "Connected processes from proposal to repository archive."}, {"id": "collaboration", "icon": "fa-users", "title": "Collaborative", "visible": true, "description": "Shared coordination for students, faculty, and support offices."}, {"id": "accessible", "icon": "fa-globe", "title": "Accessible Anywhere", "visible": true, "description": "Web-based access across role-specific workspaces."}], "subtitle": "Built for Higher Education", "heroImage": "", "heroTitle": "Thesis and Capstone Project Management System", "aboutTitle": "Connected capstone management in one workspace", "statistics": [{"id": "programs", "label": "Programs", "value": "5", "visible": true}, {"id": "roles", "label": "User Roles", "value": "8+", "visible": true}, {"id": "repository", "label": "Repository", "value": "1", "visible": true}], "description": "Manage the full lifecycle of thesis and capstone outputs, from title registration and milestone tracking to repository access, deployment, adoption, and accreditation evidence.", "showHeroImage": false, "textAlignment": "center", "primaryCtaLink": "/login", "primaryCtaText": "Open Portal", "showCtaButtons": true, "aboutDescription": "ThesisTrack centralizes capstone registration, submissions, reviews, evaluations, and archived outputs into one academic workflow.", "secondaryCtaLink": "/about", "secondaryCtaText": "Learn More"}, "tagline": "Higher Education Institutions", "version": 1, "updatedAt": "2026-08-02T09:52:28.310Z", "navigation": {"links": [{"id": "home", "href": "/#home", "label": "Home", "visible": true}, {"id": "modules", "href": "/#modules", "label": "Modules", "visible": true}, {"id": "workflow", "href": "/#workflow", "label": "Workflow", "visible": true}, {"id": "about", "href": "/about", "label": "About", "visible": true}], "subtitle": "Higher Education Institutions", "showLogin": true, "loginLabel": "Login", "showRegister": true, "registerLabel": "Sign Up"}, "systemName": "Thesis Track", "departments": [{"id": "IT", "icon": "fas fa-laptop-code", "logo": "/department-logo/IT.png", "name": "Bachelor of Science in Information Technology", "color": "#262626", "label": "BSIT - Information Technology", "stats": [], "active": true, "vision": "A nationally recognized center of excellence in Information Technology education.", "mission": "To produce globally competitive IT professionals equipped with technical skills, ethical values, and innovative mindsets.", "chartData": [], "shortName": "IT", "description": "Computing solutions, systems development, network administration, databases, and applied innovation.", "profileCard": {"heading": "PROGRAM PROFILE", "features": [], "workflowText": "Register, review, defend, archive", "workflowHeading": "WORKFLOW COVERAGE"}, "secondaryColor": "#ECBD23", "keyAreasHeading": "Key Research & Focus Areas", "keyAreasSubheading": "Areas of Excellence"}, {"id": "MET", "icon": "fas fa-industry", "logo": "/department-logo/met.png", "name": "Bachelor of Science in Manufacturing Engineering Technology", "color": "#BE123C", "label": "BSMET - Manufacturing Eng. Tech.", "stats": [], "active": true, "vision": "A leading manufacturing engineering technology program recognized for practical innovation.", "mission": "To develop competent manufacturing engineering technologists with industry-ready skills.", "chartData": [], "shortName": "MET", "description": "Manufacturing engineering, mechanical design, fabrication, and digital precision manufacturing.", "profileCard": {"heading": "PROGRAM PROFILE", "features": [], "workflowText": "Register, review, defend, archive", "workflowHeading": "WORKFLOW COVERAGE"}, "keyAreasHeading": "Key Research & Focus Areas", "keyAreasSubheading": "Areas of Excellence"}, {"id": "TCM", "icon": "fas fa-broadcast-tower", "logo": "/department-logo/tcm.png", "name": "Bachelor of Science in Technology Communication Management", "color": "#7E22CE", "label": "BSTCM - Technology Communication Mgmt.", "stats": [], "active": true, "vision": "A premier program bridging technology and communication for innovation and community development.", "mission": "To develop competent technology communication managers for modern organizations.", "chartData": [], "shortName": "TCM", "description": "Technology-driven communication systems, information systems, and organizational communication.", "profileCard": {"heading": "PROGRAM PROFILE", "features": [], "workflowText": "Register, review, defend, archive", "workflowHeading": "WORKFLOW COVERAGE"}, "keyAreasHeading": "Key Research & Focus Areas", "keyAreasSubheading": "Areas of Excellence"}, {"id": "ESM", "icon": "fas fa-bolt", "logo": "/department-logo/esm.png", "name": "Bachelor of Science in Energy Systems and Management", "color": "#15803D", "label": "BSESM - Energy Systems & Mgmt.", "stats": [], "active": true, "vision": "A recognized program leading innovation in electrical machinery and industrial automation.", "mission": "To produce highly skilled energy systems professionals for sustainable energy management.", "chartData": [], "shortName": "ESM", "description": "Electrical machinery, industrial automation, energy systems, and preventive maintenance.", "profileCard": {"heading": "PROGRAM PROFILE", "features": [], "workflowText": "Register, review, defend, archive", "workflowHeading": "WORKFLOW COVERAGE"}, "keyAreasHeading": "Key Research & Focus Areas", "keyAreasSubheading": "Areas of Excellence"}, {"id": "NAME", "icon": "fas fa-ship", "logo": "/department-logo/name.png", "name": "Bachelor of Science in Naval Architecture and Marine Engineering", "color": "#0369A1", "label": "BSNAME - Naval Architecture & Marine Eng.", "stats": [], "active": true, "vision": "A premier engineering program for marine design, construction, and maritime systems.", "mission": "To educate and train naval architects and marine engineers with comprehensive systems knowledge.", "chartData": [], "shortName": "NAME", "description": "Ship design, marine systems, systems engineering, and vessel operation.", "profileCard": {"heading": "PROGRAM PROFILE", "features": [], "workflowText": "Register, review, defend, archive", "workflowHeading": "WORKFLOW COVERAGE"}, "secondaryColor": "#1100FF", "keyAreasHeading": "Key Research & Focus Areas", "keyAreasSubheading": "Areas of Excellence"}], "themePreset": "academic-blue", "derivedColors": {"hover": "#002C6B", "darkVariant": "#1A1851", "lightVariant": "#DBEAFE", "borderSuggestion": "#BFDBFE", "backgroundSuggestion": "#EFF6FF"}, "institutionName": "University of Science and Technology of Southern Philippines (USTP)", "programsContent": {"title": "Built for multi-program coordination", "highlights": [{"id": "prog1", "label": "Academic programs", "value": "5", "visible": true}, {"id": "prog2", "label": "Shared capstone workflow", "value": "1", "visible": true}, {"id": "prog3", "label": "Department visibility", "value": "Role-based", "visible": true}], "description": "Each department keeps its own program identity, research focus, and capstone records while ThesisTrack gives research leaders one connected view of institutional progress."}, "systemShortName": "TT", "institutionTagline": "Empowering Research, Innovation, and Academic Excellence"}', 'global', 'Global system theme and branding settings.', '2026-07-19 08:06:25.185', '2026-08-02 09:52:28.311');


--
-- Data for Name: password_reset_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.password_reset_codes (id, "codeHash", "resetTokenHash", "expiresAt", "usedAt", "verifiedAt", attempts, "userId", "createdAt", "updatedAt") VALUES ('cmphv7s9r0002ocrv0omgzwtf', '$2b$12$bhEye9mXvxLbzwuMyxm6ZeafkPYZHEYGsoRMd4n87CqX6FAWDqAnO', '606205954e7652b70428eac5f16435726cb2aca00996184075b5ed1cb6fd6262', '2026-05-23 04:55:24.818', '2026-05-23 04:46:30.496', '2026-05-23 04:46:17.779', 0, 'cmphsfoon0000owrvx3vg6yxr', '2026-05-23 04:45:24.831', '2026-05-23 04:46:30.502');
INSERT INTO public.password_reset_codes (id, "codeHash", "resetTokenHash", "expiresAt", "usedAt", "verifiedAt", attempts, "userId", "createdAt", "updatedAt") VALUES ('cmqlu3y3c0000o4rvr46mh3ft', '$2b$12$ehsz.rG31jtBZ/oyO43Jk.o44iRu8lQ1Sx3imDDNypqxw9lfE4otC', 'c6c07416b0fa11414ab5546274747cd7938cec37e70b734bd311c2a73a705cfd', '2026-06-20 04:15:13.144', '2026-06-20 04:10:30.601', '2026-06-20 04:10:09.507', 0, 'cmphsfoon0000owrvx3vg6yxr', '2026-06-20 04:05:13.176', '2026-06-20 04:10:30.608');
INSERT INTO public.password_reset_codes (id, "codeHash", "resetTokenHash", "expiresAt", "usedAt", "verifiedAt", attempts, "userId", "createdAt", "updatedAt") VALUES ('cmre8g60d0000korv3my5q98h', '$2b$12$ZwpckxwErv7DleBN73e11evHaaGQPKk4smscoHt.mop9b5ZkmhKJm', NULL, '2026-07-10 01:14:10.833', '2026-07-10 01:15:18.146', NULL, 0, 'cmphsfoon0000owrvx3vg6yxr', '2026-07-10 01:04:10.861', '2026-07-10 01:15:18.151');
INSERT INTO public.password_reset_codes (id, "codeHash", "resetTokenHash", "expiresAt", "usedAt", "verifiedAt", attempts, "userId", "createdAt", "updatedAt") VALUES ('cmre8ugw90001korv5nl35jen', '$2b$12$dDu7jDNRh9X0NZx3n4zVYeIl.V08rro4GldObFEFycORv7Fy8QorC', NULL, '2026-07-10 01:18:18.146', '2026-07-10 01:24:38.83', NULL, 1, 'cmphsfoon0000owrvx3vg6yxr', '2026-07-10 01:15:18.154', '2026-07-10 01:24:38.832');
INSERT INTO public.password_reset_codes (id, "codeHash", "resetTokenHash", "expiresAt", "usedAt", "verifiedAt", attempts, "userId", "createdAt", "updatedAt") VALUES ('cmre96hiq0002korvpyx1dvfq', '$2b$12$1VapRGu7Rdo645FhnaRiyut1eip0QM0kFz3fR1RGpD7J4ErViirOe', NULL, '2026-07-10 01:27:38.83', NULL, NULL, 0, 'cmphsfoon0000owrvx3vg6yxr', '2026-07-10 01:24:38.834', '2026-07-10 01:24:38.834');


--
-- Data for Name: uploaded_files; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- PostgreSQL database dump complete
--

\unrestrict 984XEjW3kAcWaQg53da92O82m4Wai9cCvgLaDXAlIvfIJLpRDaXV7gdKp0qOc5l


SET session_replication_role = 'origin';
