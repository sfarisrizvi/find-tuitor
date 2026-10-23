# SOC Application Security Assessment & Vulnerability Audit Report

**Target Application:** TutorOnline.pk (`find-tuitor`)  
**Assessment Type:** Senior SOC & AppSec Static Code Analysis, Architecture Review, & RLS Audit  
**Assessment Date:** October 24, 2026  
**Classification:** HIGH PRIORITY / STRICTLY DEFENSIVE  
**Auditor:** Senior Security Operations & Application Security Analyst  

---

## 1. Executive Summary

A comprehensive, defense-in-depth security and architectural assessment was performed across the codebase, API routes, database migration scripts, Next.js configuration, and Supabase Row Level Security (RLS) policies.

The application implements foundational security utilities (such as payload size validation, in-memory rate limiting, and keyword filtering for contact information in chat), but **critical architectural vulnerabilities** were identified across multiple layers:
1. **Complete authorization bypass & contract/escrow tampering** via unauthenticated API routes using the Supabase Service Role key.
2. **Direct Internet exposure & arbitrary file retrieval of confidential user documents and KYC files** (CNICs, academic degrees, private chat attachments) via misconfigured public storage buckets and unauthenticated media endpoints.
3. **Mass data exposure of minor children and parent PII** (phone numbers, physical addresses, GPS coordinates, schools, grades) via overly permissive `USING (true)` and table-level RLS policies.
4. **Privilege escalation to administrator** via untrusted `user_metadata` checks.
5. **Open email relay & spam bombing** via unauthenticated notification endpoints.
6. **Complete bypass of Next.js Route Protection** due to misconfigured middleware naming (`src/proxy.js`).
7. **Financial & contract integrity loopholes** allowing direct client insertion and alteration of contracts and escrow balances without RPC validation.
8. **Denial-of-Service (OOM DoS)** via unbounded memory storage in the rate limiter and missing HTTP security headers.

---

## 2. Vulnerability Severity Matrix

| ID | Title | Severity | CVSS v3.1 | Status |
| :--- | :--- | :---: | :---: | :---: |
| **CV-01** | Broken Object Level Authorization (BOLA) in Contracts API | **CRITICAL** | 9.8 | Unpatched |
| **CV-02** | Unauthenticated Arbitrary Storage Retrieval & KYC Leak | **CRITICAL** | 9.1 | Unpatched |
| **CV-03** | Minor Children & Parent PII Mass Exposure via RLS `USING (true)` | **CRITICAL** | 8.6 | Unpatched |
| **CV-04** | Admin Privilege Escalation via Client-Controlled `user_metadata` | **CRITICAL** | 8.8 | Unpatched |
| **CV-05** | Unauthenticated Public Email Relay & Resend Quota Exhaustion | **HIGH** | 7.5 | Unpatched |
| **CV-06** | Public Storage Bucket & Policy Exposing All Chat Media to Internet | **CRITICAL** | 9.1 | Unpatched |
| **CV-07** | Permissive Insert RLS on Contracts & Notifications Tables | **HIGH** | 8.3 | Unpatched |
| **HV-01** | Inactive Route Protection Middleware (Misnamed `src/proxy.js`) | **HIGH** | 7.5 | Unpatched |
| **HV-02** | Insecure Escrow Contracts Direct Client Update Policy | **HIGH** | 7.4 | Unpatched |
| **HV-03** | Open Redirect & Host Header Injection in Auth Callback | **MEDIUM** | 6.1 | Unpatched |
| **HV-04** | Exposure of Confidential Review Private Feedback to Public via Table-Level RLS & API | **HIGH** | 7.1 | Unpatched |
| **HV-05** | In-Memory Rate Limiter Unbounded Memory Growth (OOM DoS) & IP Spoofing | **HIGH** | 7.5 | Unpatched |
| **MV-01** | Client-Enforced-Only Anti-Bot Verification on Contact API | **MEDIUM** | 5.3 | Unpatched |
| **MV-02** | Plaintext Credentials & SSH Passwords in Deployment Files & Git | **MEDIUM** | 5.0 | Action Required |
| **MV-03** | Logout CSRF & Insecure `getSession()` in Auth Signout Endpoint | **MEDIUM** | 5.4 | Unpatched |
| **MV-04** | Unrestricted Account Registration & Mass Welcome Email Flooding | **MEDIUM** | 5.3 | Unpatched |
| **MV-05** | Missing Essential HTTP Security Headers in Next.js Config | **MEDIUM** | 5.0 | Unpatched |

---

## 3. Detailed Vulnerability Findings & Technical Proof

---

### [CV-01] Broken Object Level Authorization (BOLA) in Contracts API
* **File:** [`src/app/api/chat/contracts/route.js`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/src/app/api/chat/contracts/route.js#L1-L100)
* **Severity:** **CRITICAL (CVSS: 9.8)**
* **CWE:** CWE-285 (Improper Authorization), CWE-306 (Missing Authentication)

#### Vulnerability Description:
The route instantiates Supabase with the administrative `SUPABASE_SERVICE_ROLE_KEY` at module scope:
```javascript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```
In `POST(request)`, the handler does **not** verify the caller's session via `auth.getUser()`. Instead, it reads `client_id`, `tutor_id`, `user_id`, and `contract_id` directly from `request.json()`:
```javascript
if (action === 'approve_contract') {
  if (user_id === contractToApprove.tutor_id) { ... }
  if (user_id === contractToApprove.client_id) { ... }
}
```
Because the server never checks authentication cookies, an attacker can supply any arbitrary `user_id` in the JSON body. 

#### Business & Operational Impact:
* Attackers can impersonate any client or tutor.
* Attackers can approve contracts on behalf of users, forcing financial credit deductions via `lock_contract_escrow` and `tutor_accept_contract_fee`.
* Attackers can complete contracts or inject unauthorized chat messages.

#### Remediation:
1. Extract session credentials using `createServerClient` from `@/utils/supabase/server`.
2. Reject unauthenticated requests with `401 Unauthorized`.
3. Overwrite `user_id`, `client_id`, or `tutor_id` with `user.id` from the verified session, never trusting the client JSON body.

---

### [CV-02] Unauthenticated Arbitrary Storage Retrieval & KYC Document Leak
* **File:** [`src/app/api/chat/media/route.js`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/src/app/api/chat/media/route.js#L29-L65)
* **Severity:** **CRITICAL (CVSS: 9.1)**
* **CWE:** CWE-639 (Insecure Direct Object References), CWE-284 (Improper Access Control)

#### Vulnerability Description:
The media route acts as a gateway to Supabase Storage:
```javascript
const ALLOWED_BUCKETS = ['chat-media', 'teacher-media', 'teacher-files', 'client-files'];
...
const { data: blob } = await supabaseAdmin.storage
  .from(bucket)
  .download(cleanPath);
```
* **No Authentication:** There is zero verification of whether the user is logged in.
* **No Object Ownership Check:** Any requester can specify `bucket=teacher-files` (which contains confidential tutor CNIC scans, academic transcripts, and verification records) or `bucket=client-files` and download files directly via `supabaseAdmin`.

#### Business & Operational Impact:
Mass exfiltration of confidential tutor identity records, national identity cards (CNICs), degree certificates, and private chat attachments.

#### Remediation:
1. Require verified user authentication on `GET /api/chat/media`.
2. For `chat-media`: Verify that `auth.uid()` belongs to either the sender or receiver of the message associated with the attachment.
3. For `teacher-files` / `client-files`: Only allow the file owner or an authenticated `admin` to access these buckets.

---

### [CV-03] Children Records & Parent PII Mass Exposure via RLS `USING (true)`
* **Files:** 
  * [`scripts/04_fix_rls_and_permissions.sql`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/scripts/04_fix_rls_and_permissions.sql#L15-L20)
  * [`scripts/05_fix_client_profiles_rls.sql`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/scripts/05_fix_client_profiles_rls.sql#L4-L16)
* **Severity:** **CRITICAL (CVSS: 8.6)**
* **CWE:** CWE-200 (Exposure of Sensitive Information to an Unauthorized Actor)

#### Vulnerability Description:
Migrations 04 and 05 created global read policies to resolve chat name display issues:
```sql
CREATE POLICY "Allow authenticated select children"
  ON public.children FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view client profiles"
  ON public.client_profiles FOR SELECT TO authenticated
  USING (true);
```
Because the Supabase anon key is in client code, any registered user (including self-registered throwaway accounts) can run:
```javascript
await supabase.from('children').select('*');
await supabase.from('client_profiles').select('*');
```
This query returns:
* Minor children’s full names, grades, schools, and academic subjects.
* Parents' full names, phone numbers, email addresses, physical home addresses, and exact latitude/longitude coordinates.

#### Remediation:
1. **Children Table Policy:** Restrict `SELECT` on `public.children` to:
   ```sql
   USING (
     auth.uid() = client_id 
     OR public.is_admin()
     OR EXISTS (
       SELECT 1 FROM public.contracts c 
       WHERE (c.tutor_id = auth.uid() OR c.client_id = auth.uid()) 
         AND public.children.id = ANY(c.child_ids)
     )
   );
   ```
2. **Client Profiles Policy:** Restrict public client profile reads to safe display columns (`id, full_name, avatar_url, city`). Physical address and phone numbers must only be readable by `auth.uid() = id`, `is_admin()`, or tutors with an active contract via a secure database view or RPC.

---

### [CV-04] Admin Privilege Escalation via Client-Controlled `user_metadata`
* **File:** [`src/app/api/admin/kyc/route.js`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/src/app/api/admin/kyc/route.js#L6-L17)
* **Severity:** **CRITICAL (CVSS: 8.8)**
* **CWE:** CWE-269 (Improper Privilege Management), CWE-602 (Client-Side Enforcement of Server-Side Security)

#### Vulnerability Description:
In `src/app/api/admin/kyc/route.js`, the admin authorization check states:
```javascript
async function checkIsAdmin(supabaseUser, user) {
  if (!user) return false;
  if (user.user_metadata?.role === 'admin') return true; // <-- VULNERABILITY

  const { data: roleRecord } = await supabaseUser
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  return roleRecord?.role === 'admin';
}
```
In Supabase Auth, `user_metadata` (`raw_user_meta_data`) can be specified by the client during `supabase.auth.signUp()` or updated via `supabase.auth.updateUser({ data: { role: 'admin' } })`. 
Because line 8 trusts `user.user_metadata.role`, an attacker can modify their user metadata to `'admin'` and gain access to the admin KYC queue to inspect, approve, or reject tutors.

#### Remediation:
Remove `user.user_metadata?.role === 'admin'` entirely. Role verification must **only** query the server-controlled `public.user_roles` table or use the database function `public.is_admin()`.

---

### [CV-05] Unauthenticated Public Email Relay & Resend Quota Exhaustion
* **File:** [`src/app/api/welcome/route.js`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/src/app/api/welcome/route.js#L4-L45)
* **Severity:** **HIGH (CVSS: 7.5)**
* **CWE:** CWE-306 (Missing Authentication for Critical Function)

#### Vulnerability Description:
`POST /api/welcome` accepts `{ userId, userEmail, userName, role }` without authentication or rate limiting, and dispatches a welcome email via Resend:
```javascript
export async function POST(request) {
  const { userId, userEmail, userName, role } = await request.json();
  ...
  await sendNotification({ ... });
}
```
An attacker can script high-volume requests to this endpoint, using `parhlo@tutoronline.pk` as an open spam relay to email arbitrary targets.

#### Business & Operational Impact:
* Domain blacklisting on Spamhaus/Gmail.
* Depletion of paid Resend email credits.
* Database bloat in the `notifications` table.

#### Remediation:
1. Verify session: `auth.getUser()`. Require that `user.id === requestedUserId` AND `user.email === requestedUserEmail`.
2. Apply strict IP rate limiting (1 request per hour per user).
3. Ensure server registration flow (`/api/auth/register`) dispatches emails server-side directly, removing client-side calls to `/api/welcome`.

---

### [CV-06] Public Storage Bucket & Policy Exposing All Chat Media to Internet
* **File:** [`scripts/03_contracts_and_chat_system.sql`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/scripts/03_contracts_and_chat_system.sql#L83-L97)
* **Severity:** **CRITICAL (CVSS: 9.1)**
* **CWE:** CWE-284 (Improper Access Control), CWE-732 (Incorrect Permission Assignment for Critical Resource)

#### Vulnerability Description:
In Migration 03, the `chat-media` storage bucket was created as public, and a global public select policy was applied:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true);

CREATE POLICY "Anyone can view chat media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'chat-media');
```
Even if `/api/chat/media` were secured, this database policy allows **anyone on the public internet** to query or directly download private chat images, voice notes, and contract documents directly from the Supabase public storage endpoint without an account or session token.

#### Business & Operational Impact:
Private user communications, voice notes, tutoring notes, and student files are directly accessible worldwide via standard storage URLs.

#### Remediation:
1. Update `storage.buckets` to set `public = false` for `chat-media`.
2. Drop `"Anyone can view chat media"` policy.
3. Restrict `SELECT` on `storage.objects` for `chat-media` to authenticated conversation participants or serve files exclusively via signed URLs / authenticated API proxy.

---

### [CV-07] Permissive Insert RLS on Contracts & Notifications Tables
* **File:** [`scripts/04_fix_rls_and_permissions.sql`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/scripts/04_fix_rls_and_permissions.sql#L11-L26)
* **Severity:** **HIGH (CVSS: 8.3)**
* **CWE:** CWE-284 (Improper Access Control)

#### Vulnerability Description:
Migration 04 added overly permissive insert policies:
```sql
CREATE POLICY "Allow authenticated insert contracts"
  ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow system insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);
```
With `WITH CHECK (true)`:
* Any logged-in user can directly insert contracts specifying any arbitrary `client_id`, `tutor_id`, `amount`, and `status: 'active'`, completely bypassing escrow funding requirements and platform fees.
* Any logged-in user can insert spoofed notifications into any other user's account (`user_id = target_uuid`), facilitating in-app phishing or harassment.

#### Remediation:
1. Re-restrict `contracts` insert policy to require `auth.uid() = client_id OR auth.uid() = tutor_id OR public.is_admin()`, and force initial status to `'pending'`.
2. Re-restrict `notifications` insert policy so that regular users can only insert notifications where `auth.uid() = user_id`, or require admin role / database RPC for cross-user notifications.

---

### [HV-01] Inactive Route Protection Middleware
* **File:** [`src/proxy.js`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/src/proxy.js#L1-L120)
* **Severity:** **HIGH (CVSS: 7.5)**
* **CWE:** CWE-1188 (Insecure Default Initialization of Resource)

#### Vulnerability Description:
The file designed to enforce route authentication, session refresh, and tutor/client role separation is named:
`src/proxy.js` with `export async function proxy(request)`
Next.js **only** recognizes middleware if the file is named `middleware.js` or `middleware.ts` exporting `middleware`. Because of this naming, Next.js completely ignores `src/proxy.js`.
* Protected paths (`/client/*`, `/tutor/*`) are **not** guarded at the edge or server layer before rendering.
* Protection currently relies exclusively on client-side `useEffect` redirects, which allows unauthenticated visitors to download compiled page code.

#### Remediation:
Rename `src/proxy.js` to `src/middleware.js` and change the exported function to `export async function middleware(request)`. Ensure role checks query `public.user_roles` instead of trusting `user.user_metadata?.role`.

---

### [HV-02] Insecure Escrow Contracts Direct Client Update Policy
* **File:** [`scripts/06_credit_system_and_wallets.sql`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/scripts/06_credit_system_and_wallets.sql#L170-L179)
* **Severity:** **HIGH (CVSS: 7.4)**
* **CWE:** CWE-284 (Improper Access Control)

#### Vulnerability Description:
The RLS insert and update policies for `escrow_contracts` allow direct manipulation from clients or tutors:
```sql
CREATE POLICY "Participants and admin update escrow contracts"
  ON public.escrow_contracts FOR UPDATE TO authenticated
  USING ( auth.uid() = client_id OR auth.uid() = tutor_id OR public.is_admin() )
  WITH CHECK ( auth.uid() = client_id OR auth.uid() = tutor_id OR public.is_admin() );
```
This policy lacks column-level or state-transition constraints. A participating user can issue a direct update through the Supabase client to alter contract escrow status (e.g. changing from `held` to `released`) or altering financial values without executing the required RPCs.

#### Remediation:
Revoke direct `INSERT` and `UPDATE` on `escrow_contracts` from the `authenticated` role. Escrow state transitions must only be performed through PostgreSQL `SECURITY DEFINER` functions (`complete_contract_and_unlock_review`, `lock_contract_escrow`) and administrator actions.

---

### [HV-03] Open Redirect & Host Header Injection in Auth Callback
* **File:** [`src/app/api/auth/callback/route.js`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/src/app/api/auth/callback/route.js#L6-L51)
* **Severity:** **MEDIUM (CVSS: 6.1)**
* **CWE:** CWE-601 (Open Redirect)

#### Vulnerability Description:
```javascript
const next = searchParams.get('next') ?? '/tutor/dashboard'
const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'signup.tutoronline.pk'
const protocol = request.headers.get('x-forwarded-proto') || 'https'
const absoluteOrigin = `${protocol}://${host}`
...
return NextResponse.redirect(`${absoluteOrigin}${next}`)
```
If `next` contains relative schemes (`//evil.com`), or if `X-Forwarded-Host` is forged by an upstream proxy, users can be redirected offsite to phishing destinations upon authentication.

#### Remediation:
1. Validate `next` against a strict whitelist or ensure it begins with a single `/` and does not begin with `//` or `/\`.
2. Use an environment-configured origin (`process.env.NEXT_PUBLIC_SITE_URL`) rather than trusting raw request headers.

---

### [HV-04] Exposure of Confidential Review Private Feedback to Public
* **Files:**
  * [`scripts/09_contract_reviews_and_reputation.sql`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/scripts/09_contract_reviews_and_reputation.sql#L53-L57)
  * [`src/app/api/reviews/route.js`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/src/app/api/reviews/route.js#L29-L38)
* **Severity:** **HIGH (CVSS: 7.1)**
* **CWE:** CWE-200 (Exposure of Sensitive Information to an Unauthorized Actor)

#### Vulnerability Description:
1. In `scripts/09_contract_reviews_and_reputation.sql`, the public read policy on `contract_reviews` allows selecting all rows where `status = 'published'`. Because PostgreSQL RLS is row-level rather than column-level, selecting from `contract_reviews` exposes the `private_feedback` column to anyone with the public anon key.
2. In `src/app/api/reviews/route.js` (Scenario A), an unauthenticated caller can pass `GET /api/reviews?contract_id=<uuid>` and the server executes `serviceClient.from('contract_reviews').select('*').eq('contract_id', contractId)`. This directly returns `private_feedback` in the JSON response without checking if the caller is an admin or the reviewer.

#### Remediation:
1. In `src/app/api/reviews/route.js`: Require authentication for `contract_id` queries, verify participant status, and strip `private_feedback` unless the caller is `reviewer_id` or an admin.
2. In database: Create a sanitized view `public.public_contract_reviews` omitting `private_feedback`, or set column-level permissions.

---

### [HV-05] In-Memory Rate Limiter Unbounded Memory Growth (OOM DoS) & IP Spoofing
* **File:** [`src/lib/security/rateLimiter.js`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/src/lib/security/rateLimiter.js#L1-L26)
* **Severity:** **HIGH (CVSS: 7.5)**
* **CWE:** CWE-400 (Uncontrolled Resource Consumption), CWE-290 (Authentication Bypass by Spoofing)

#### Vulnerability Description:
1. **Memory Exhaustion (OOM):** `const rateCache = new Map();` stores rate-limiting keys indefinitely without TTL pruning, maximum size boundaries, or LRU eviction. An attacker sending requests with thousands of random spoofed IPs will cause node memory consumption to spike indefinitely, crashing the Next.js process (Denial of Service).
2. **IP Header Forgery:** `const ip = req.headers.get('x-forwarded-for') || ...;` does not sanitize comma-separated proxy chains (`ip.split(',')[0].trim()`). Rotating an arbitrary header value completely evades the rate limiter.

#### Remediation:
1. Implement a sliding window with an LRU cache or maximum capacity (e.g., max 10,000 active IP entries with automatic periodic sweep).
2. Cleanly extract client IP: `(req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1'`.

---

### [MV-01] Client-Enforced-Only Anti-Bot Verification on Contact API
* **File:** [`src/app/api/contact/route.js`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/src/app/api/contact/route.js#L19-L31)
* **Severity:** **MEDIUM (CVSS: 5.3)**
* **CWE:** CWE-799 (Improper Control of Generation of Code / Rate Limiting)

#### Vulnerability Description:
The contact endpoint checks:
```javascript
if (!isVerified) return NextResponse.json({ error: '...' }, { status: 400 });
if (typeof timeSpentMs === 'number' && timeSpentMs < 2000) return ...;
```
Both `isVerified` and `timeSpentMs` are arbitrary client JSON values easily forged by automated scripts, allowing bypass of the slide-to-verify protection. Furthermore, `/api/contact` lacks rate limiting and payload size validation.

#### Remediation:
1. Apply `rateLimiter` (5 submissions per 15 minutes per IP) and `validatePayloadSize`.
2. Integrate server-side challenge verification (e.g. Cloudflare Turnstile).

---

### [MV-02] Plaintext Credentials in Deploy Scripts & Git History
* **Files:** [`remote_deploy.sh`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/remote_deploy.sh#L12-L17), [`.env.local`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/.env.local#L3-L7)
* **Severity:** **MEDIUM (CVSS: 5.0)**
* **CWE:** CWE-798 (Use of Hard-coded Credentials)

#### Vulnerability Description:
* `remote_deploy.sh` contains hardcoded production `DATABASE_URL` with database passwords and `SUPABASE_SERVICE_ROLE_KEY`.
* Git commit history contains prior commits where database credentials were added and subsequently removed.

#### Remediation:
1. Ensure `.env.local` and all `.sh` deploy scripts containing credentials remain in `.gitignore`.
2. Rotate the Supabase service role key and Postgres database password in the Supabase Dashboard.

---

### [MV-03] Logout CSRF & Insecure `getSession()` in Auth Signout Endpoint
* **File:** [`src/app/api/auth/signout/route.js`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/src/app/api/auth/signout/route.js#L29-L67)
* **Severity:** **MEDIUM (CVSS: 5.4)**
* **CWE:** CWE-352 (Cross-Site Request Forgery), CWE-287 (Improper Authentication)

#### Vulnerability Description:
1. `GET /api/auth/signout` triggers full signout and cookie clearing without CSRF protection. An external site embedding `<img src="https://tutoronline.pk/api/auth/signout">` can force any authenticated user to be signed out.
2. Signout uses `supabase.auth.getSession()` on the server side instead of `supabase.auth.getUser()`.
3. The redirect uses unvalidated host headers: `new URL(targetPath, `${protocol}://${host}`)`.

#### Remediation:
1. Require POST method for signout; disable or strictly guard GET signout with anti-CSRF / origin checks.
2. Replace `getSession()` with `getUser()`.
3. Use trusted site URL for redirects.

---

### [MV-04] Unrestricted Account Registration & Mass Welcome Email Flooding
* **File:** [`src/app/api/auth/register/route.js`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/src/app/api/auth/register/route.js#L6-L45)
* **Severity:** **MEDIUM (CVSS: 5.3)**
* **CWE:** CWE-799 (Improper Control of Generation of Code / Rate Limiting)

#### Vulnerability Description:
`POST /api/auth/register` creates pre-confirmed accounts (`email_confirm: true`) and triggers Resend welcome emails via `sendNotification` without rate limiting, password complexity validation, or bot verification. Automated scripts can generate thousands of fake tutor profiles and exhaust Resend quotas.

#### Remediation:
1. Apply `rateLimiter` (3 registrations per hour per IP).
2. Validate password length (minimum 8 characters with numbers and symbols).
3. Validate email formats strictly before calling `admin.createUser`.

---

### [MV-05] Missing Essential HTTP Security Headers in Next.js Config
* **File:** [`next.config.mjs`](file:///Users/quecko/Documents/Web%20Projects/Tuitor%20App/next.config.mjs#L1-L23)
* **Severity:** **MEDIUM (CVSS: 5.0)**
* **CWE:** CWE-693 (Protection Mechanism Failure)

#### Vulnerability Description:
`next.config.mjs` defines zero HTTP response security headers. The application lacks:
* `Strict-Transport-Security` (HSTS)
* `X-Frame-Options` (Clickjacking defense)
* `X-Content-Type-Options: nosniff` (MIME-sniffing defense)
* `Referrer-Policy: strict-origin-when-cross-origin`
* `Permissions-Policy` (Camera, microphone, geolocation restrictions)
* `Content-Security-Policy` (CSP)

#### Remediation:
Add a comprehensive `headers()` async configuration in `next.config.mjs` injecting enterprise security headers across all routes.

---

## 4. Prioritized Remediation Roadmap

```
[ PHASE 1: IMMEDIATE CRITICAL API & STORAGE LOCKDOWN (Day 1) ]
├── 1. Fix Contracts API BOLA (CV-01): Enforce auth.getUser() in /api/chat/contracts.
├── 2. Lock Down Storage Access (CV-02 & CV-06):
│      ├── Secure /api/chat/media route with ownership checks.
│      └── Make chat-media bucket PRIVATE and drop public SELECT policy.
├── 3. Eliminate Admin Privilege Escalation (CV-04): Remove user_metadata check in /api/admin/kyc.
├── 4. Secure Public Email Route (CV-05): Authenticate & rate-limit /api/welcome.
└── 5. Fix In-Memory Rate Limiter (HV-05): Add LRU pruning and client IP sanitization.

[ PHASE 2: DATABASE & ROW LEVEL SECURITY (RLS) HARDENING (Day 2) ]
├── 6. Apply Migration 10 (scripts/10_security_hardening_rls.sql):
│      ├── Revoke USING (true) on public.children (CV-03).
│      ├── Scope public.client_profiles to prevent parent PII scraping (CV-03).
│      ├── Restrict public.contracts insert & update policies (CV-07).
│      ├── Revoke direct INSERT/UPDATE on public.escrow_contracts (HV-02).
│      ├── Restrict public.notifications inserts to self/admin (CV-07).
│      └── Hide private_feedback in public.contract_reviews (HV-04).
└── 7. Fix Reviews API Scenario A (HV-04): Restrict contract review queries and strip private feedback.

[ PHASE 3: MIDDLEWARE, AUTHENTICATION & HEADER HYGIENE (Day 3) ]
├── 8. Activate Next.js Route Protection (HV-01): Rename src/proxy.js to src/middleware.js.
├── 9. Sanitize Auth Callback Redirects (HV-03): Enforce relative path whitelisting.
├── 10. Harden Signout Route (MV-03): Disallow GET logout and upgrade to getUser().
├── 11. Rate-Limit Registration & Contact APIs (MV-01 & MV-04): Add rate limits & input validation.
└── 12. Inject Enterprise Security Headers (MV-05): Configure next.config.mjs.

[ PHASE 4: DEFENSE-IN-DEPTH & CREDENTIAL ROTATION (Day 4) ]
├── 13. Rotate Supabase Service Role Key & Database Password in Supabase Dashboard (MV-02).
├── 14. Verify .env.local and remote_deploy.sh are omitted from git tracking.
└── 15. Perform automated end-to-end regression and verification testing.
```
