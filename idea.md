# Find Tutors Platform - Implementation Plan

This document outlines the proposed implementation plan to build the "Find Tutors" Next.js web client based on your Product Requirements Document (PRD) and subsequent feedback.

## Goal Description
The objective is to establish the foundation of the "Find Tutors" marketplace for the Pakistani market. The platform connects students/parents with verified tutors for physical and online classes, enforcing an escrow-based payment system. The architecture will use Next.js for the frontend, Supabase for Auth & Database, and a MongoDB-inspired design system (`design.md`) featuring dark teal accents, stark white surfaces, and bright green CTAs.

## User Review Required

> [!IMPORTANT]
> **Supabase Auth & DB:** We will use Supabase for authentication and database management. The initial build will scaffold the Next.js frontend with Supabase integration.
> **Manual KYC:** We will implement a manual KYC process where tutors upload documents, and admins review them in the dashboard.
> **Location:** Instead of exact map pin drops, we will use a city/area selector for location-based operations.

## Proposed Changes

### 1. Project Scaffolding
- Initialize Next.js (App Router) using `npx create-next-app@latest`.
- Install Supabase SDK (`@supabase/supabase-js`, `@supabase/ssr`).
- Use **Vanilla CSS** with global variables mapped to the MongoDB design system provided in `design.md` (e.g., `{colors.brand-green}`, `{colors.brand-teal-deep}`).

### 2. Global Navigation & Auth Flow
- **Public Navbar:** Logo, "Find Tutors", "Find Jobs", "Login", "Sign Up" (bright green pill button).
- **Authentication (Supabase):**
  - Sign Up routing asks user to select role: "I am a Parent/Student" or "I am a Tutor".
  - Collects basic info (Name, Email, Phone, City).
  - Redirects to respective onboarding flows based on role.

### 3. Role-Based Dashboards & Flows

#### A. Parent / Student Flow
**1. Onboarding:**
- Completes profile (City selector, preferred subjects, standard routes like O/A Levels, Matric).
**2. Main Dashboard (`/parent/dashboard`):**
- **Nav:** Dashboard | Search Tutors | My Jobs | Messages | Wallet
- **Active Engagements Deck:** Quick view of currently hired tutors, contract status, escrow balance, and "Enter Class" / "Message" CTAs.
**3. Searching & Filtering Tutors (`/parent/search`):**
- **Filters:** City/Area selector, Route (Matric, FSc, O-Levels, etc.), Subject, Mode (Online/Physical), Hourly Rate slider, Tutor Tier (ID Verified, Academic Elite).
- **Results:** Grid of tutor cards displaying profile pic, JSS score, hourly rate, and badges.
- **Action:** Click to view full profile, "Invite to Job", or "Direct Message".
**4. Posting a Job (`/parent/jobs/new`):**
- Guided wizard: Title, Route, Subject, Mode (Physical via City Selector or Online), Fixed/Hourly Budget.
**5. Proposal Management Hub:**
- View incoming bids from tutors.
- Prioritized list (boosted bids at top).
- Actions: Accept Bid (triggers escrow deposit flow), Decline, Message/Schedule 15m Demo.
**6. Wallet & Escrow (`/parent/wallet`):**
- View current balance, fund escrow for a milestone, release milestone to tutor.

#### B. Tutor Flow
**1. Onboarding & Verification (KYC):**
- **Profile Setup:** Adds education, subjects, rate, and City/Area.
- **KYC Upload:** Uploads front/back of CNIC and academic transcripts via a secure form. Status marked as "Pending".
- **Tier System:** Tutor is "Tier 1" until Admin approves KYC (promoted to "Tier 2 / 3").
**2. Main Dashboard (`/tutor/dashboard`):**
- **Nav:** Dashboard | Find Jobs | My Contracts | Messages | Earnings
- **Overview:** Available Balance, Active Contracts, Remaining Connects (Monthly reset).
**3. Finding Jobs (`/tutor/jobs`):**
- **Filters:** City/Area (for physical), Route, Subject, Budget type.
- **Job Feed:** List of parent job posts.
**4. Bidding (Connects System):**
- Click job to view details.
- "Submit Proposal" CTA.
- Modal inputs: Cover letter, Bid amount, Option to use extra "Connects" to boost proposal.
**5. Active Contracts & Delivery:**
- View active milestones.
- Submit work / log hours for approval.
**6. Earnings & Withdrawals (`/tutor/earnings`):**
- Ledger table of earned funds.
- Input IBAN / JazzCash to withdraw available balance.

#### C. Business Admin Flow
**1. Admin Dashboard (`/admin/dashboard`):**
- **Nav:** Overview | KYC Verification | Users | Disputes | Financials
- **Global Metrics:** GMV, Total Escrow locked, Total platform fees earned.
**2. KYC & Document Verification (`/admin/kyc`):**
- Queue of pending tutor verification requests.
- **Review UI:** Side-by-side view. Left: Tutor profile details. Right: Uploaded CNIC/Transcripts.
- **Actions:** "Approve" (upgrades Tier & badges), "Reject" (with reason input), "Request Clearer Image".
**3. User Management (`/admin/users`):**
- Table of all parents and tutors.
- Actions: Suspend account, manually adjust JSS score, edit profiles.
**4. Dispute Resolution (`/admin/disputes`):**
- Queue of flagged contracts (e.g., Parent refuses to release escrow).
- View evidence docket: Chat logs, contract terms.
- Actions: Force release escrow to tutor, or refund parent.
**5. Financial Operations (`/admin/financials`):**
- Manage payouts (approve tutor withdrawal requests).
- View platform revenue ledger.

## Verification Plan
1. Create mock data structures for Jobs, Proposals, Users, and KYC Requests.
2. Build static React components for all routes specified above.
3. Validate navigation flow across Parent, Tutor, and Admin dashboards.
4. Ensure styling matches the `design.md` specifications (Euclid Circular A font fallback, deep teal hero bands, brand-green buttons, pill radii).
