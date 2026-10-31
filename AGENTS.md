# Nexum backend rules (freelancer dashboard)
## Context
Nexum is an AI-mediated freelance workspace. Each user has a private Nexum 
AI; each project has a shared space where a client and a freelancer 
collaborate. Nexum AI sits between them: it drafts, summarises and relays, 
and humans approve every commitment. The frontend already exists. The backend 
serves it. Do not redesign the UI.
## Working rules- Read the existing frontend first. Build only the endpoints and fields the 
screens need. If you add a field the UI does not use, say so.- One phase at a time. Start each phase with a written plan (tables, 
endpoints, files, tests) and wait for approval before coding.- Every endpoint has: input validation (Zod), authentication, a role check, 
an ownership check, and one error shape: { error: { code, message, details } 
}.- Never trust the client for user id, role, status, price or amount. Read 
them from the session or the database.- Money is stored as integer minor units plus a currency code. Never use 
floating point for money.- Dashboard counts and totals come from queries over real records. Never 
hardcode a number.- Proposal status, project status, milestone work status and payment status 
are four separate fields. Never merge them.- Write an append-only audit event for every state change: actor, action, 
object, previous status, new status, timestamp.- A user's private Nexum AI conversation is never readable by the other 
party. Enforce this in the query layer, not only in the UI.- AI output is a draft until a human approves it. AI cannot approve, pay, 
accept work, send a commitment or change an agreement.- Do not call a sandbox capture escrow. Do not call a simulated release a 
payout. An unknown payment outcome stays unknown until reconciled.- Do not fabricate ratings, earnings, availability, experience statistics or client trust badges. Show nothing instead.- Secrets live in environment variables only. Keep .env.example current.- Write tests with each feature. A phase is not finished until its 
verification script passes. Report test results honestly, including failures 
and anything skipped.- Commit small, with the message: phase-N: <summary>.
## Never- Do not edit frontend code except the API client wiring the phase asks for.- Do not edit or delete applied migrations. Add a new migration.- Do not store plain-text passwords, tokens or API keys anywhere, including 
logs and seed files