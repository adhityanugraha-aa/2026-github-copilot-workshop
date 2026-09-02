# Team Member Onboarding Guide

Welcome to the Procurement MVP project! This guide will get you up to speed on what we're building, how it works, and what to focus on first.

---

## 🎯 What We're Building

**Procurement MVP** is a web-based procurement application that automates the flow of requisitions, purchase orders, and goods receipts. It's a realistic but focused system built specifically for learning Copilot across the full software development lifecycle.

### Business Flow: PR → PO → GR

```
┌─────────────────────────────────────────────────────────────┐
│                    PURCHASE REQUISITION (PR)                 │
│  User submits a request to buy items (status: DRAFT→APPROVED)│
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   PURCHASE ORDER (PO)                        │
│  Buyer creates orders from approved PR lines (DRAFT→SUBMITTED)│
│  ✓ Validates: can't order more than PR requested             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   GOODS RECEIPT (GR)                         │
│  Receiver confirms items arrived (DRAFT→POSTED)             │
│  ✓ Validates: can't receive more than PO ordered            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         Track quantities across full procurement chain        │
│  PR Detail shows: lines + allocated quantities + received    │
└─────────────────────────────────────────────────────────────┘
```

**Key Rules:**
- PO allocated qty must not exceed PR line remaining qty
- GR received qty must not exceed PO line ordered qty
- Status transitions are strictly enforced (no skipping states)

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Backend API** | Fastify (Node.js/JavaScript) | Lightweight REST API for all procurement operations |
| **Database** | PostgreSQL 16 (Docker) | Persistent storage with schema migrations |
| **Frontend** | Vue 3 + Vite (JavaScript) | Modern, fast UI with hot module reloading |
| **Unit Tests** | Jest | Service and business logic validation |
| **E2E Tests** | Playwright | End-to-end browser automation |
| **Local Dev** | Docker Compose | One-command database setup |

**Why this stack?**
- Fastify is lightweight and scaffolding-friendly with Copilot
- Vue + Vite gives fast feedback during development
- PostgreSQL in Docker is production-realistic and portable
- Jest + Playwright demonstrate both API and UI testing

---

## 📋 Repository Status

### ✅ Already Implemented (Baseline)
- PostgreSQL schema + seed data (auto-bootstraps via Docker)
- Home/Dashboard page
- **PR module fully working:**
  - PR list/create/detail pages
  - PR API endpoints (create, submit, approve, get, open-lines)
  - PR business logic and validations

### 🔨 Your Implementation Focus: PO Module
- PO list/create/detail pages (frontend)
- PO API endpoints (backend)
- PO business logic & quantity validations
- Jest tests for PO rules
- Playwright tests for PO workflow

### 📚 Out of Scope (Further Exploration)
- Goods Receipt (GR) module (leave for self-paced learning)
- Advanced approval workflows
- Reporting and analytics
- Production hardening

---

## 🚀 First 3 Tasks

### **Task 1: Local Setup & Baseline Verification** (30 mins)
**Objective:** Get the app running locally and verify the PR module works

1. **Clone and navigate:**
   ```bash
   git clone https://github.com/adhityanugraha-aa/2026-github-copilot-workshop.git
   cd 2026-github-copilot-workshop
   ```

2. **Start PostgreSQL:**
   ```bash
   docker compose down -v  # Clean start
   docker compose up -d db
   ```

3. **Verify database initialized:**
   ```bash
   docker compose exec -T db psql -U workshop -d procurement_mvp \
     -c "SELECT pr_number, status FROM purchase_requisitions ORDER BY pr_number;"
   ```
   ✓ You should see 2-3 sample PRs already in APPROVED status

4. **Start backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   ✓ Server should listen on `http://localhost:3000`

5. **Start frontend (new terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   ✓ App should open at `http://localhost:5173`

6. **Smoke test:**
   - Navigate to PR List
   - Click on one of the approved PRs
   - Verify you see PR details and line items
   - **Document:** Take a screenshot of PR detail for your notes

---

### **Task 2: Understand the Data Model & PR APIs** (45 mins)
**Objective:** Map the database schema to the API layer

1. **Study the schema:**
   - Open `db/migrations/001_init_procurement_mvp.sql`
   - Pay attention to these tables:
     - `purchase_requisitions` (PR headers)
     - `pr_lines` (items on a PR)
     - `purchase_orders` (PO headers)
     - `po_lines` (items on a PO)
     - `pr_line_allocations` (bridge between PR and PO lines)
   
2. **Review the plan:**
   - Open `docs/plan.md` → Section 5 (Data Model)
   - Understand: how are PR quantities tracked? (`qty_requested`, `qty_allocated`, `qty_received`)

3. **Explore PR API endpoints:**
   - Open `backend/src/routes/requisitions.js` (or similar)
   - Trace one endpoint: `POST /api/requisitions/:id/approve`
   - Understand: what validations happen? What service layer methods are called?

4. **Test a PR API:**
   ```bash
   curl http://localhost:3000/api/requisitions/[pr_id]/open-lines
   ```
   ✓ You should see PR line items that can be allocated to a PO

5. **Document:** Sketch a quick diagram showing:
   - PR has many PR lines
   - Each PR line can be allocated to multiple PO lines
   - Track quantities: `qty_requested` → `qty_allocated` → `qty_received`

---

### **Task 3: Design the PO Module APIs** (45 mins)
**Objective:** Plan the PO endpoints before implementing

1. **Review the API specification:**
   - Open `docs/plan.md` → Section 4 (API Scope)
   - Read the Purchase Order section:
     ```
     - POST /api/purchase-orders (create PO)
     - POST /api/purchase-orders/:id/submit (submit PO)
     - GET /api/purchase-orders/:id (get PO detail)
     - GET /api/purchase-orders/:id/open-lines (get unallocated PO lines)
     ```

2. **Review PO validation rules:**
   - Open `docs/plan.md` → Section 5.3 (Rule Mapping)
   - Focus on: "PO allocated qty ≤ PR line remaining qty"
   - Understand: when you create a PO line, you must check PR line available quantity

3. **Create a design document:**
   - Create file: `docs/PO_MODULE_DESIGN.md`
   - Document (with Copilot help if desired):
     - **PO Create endpoint** — input validation, business rules to check
     - **PO allocation logic** — how to prevent over-allocation
     - **PO Submit endpoint** — status transition rules
     - **PO Detail endpoint** — what fields to return
     - **Error handling** — what errors should return 400 vs 409 vs 500

4. **Sketch the PO service layer:**
   - List the service methods you'll need:
     - `createPO(vendorName, poLines)`
     - `validateAllocation(prLineId, requestedQty)`
     - `submitPO(poId)`
     - `getPODetail(poId)`
   
5. **Share your design:**
   - Commit `docs/PO_MODULE_DESIGN.md` as a draft PR or discussion
   - This becomes the contract between frontend and backend teams

---

## 📁 Key Files to Know

```
2026-github-copilot-workshop/
├── db/
│   ├── migrations/001_init_procurement_mvp.sql  ← Schema definition
│   └── seeds/002_seed_procurement_mvp.sql       ← Sample data
├── docker-compose.yml                            ← Local environment
├── backend/
│   ├── src/routes/                              ← API endpoints
│   ├── src/services/                            ← Business logic
│   ├── src/models/                              ← DB queries
│   └── tests/                                   ← Jest test suites
├── frontend/
│   ├── src/pages/                               ← Vue pages
│   ├── src/components/                          ← Vue components
│   ├── src/api/                                 ← API client
│   └── e2e/                                     ← Playwright tests
├── docs/
│   ├── plan.md                                  ← Full workshop plan
│   ├── ONBOARDING.md                            ← This file
│   └── PO_MODULE_DESIGN.md                      ← Your design (next)
└── README.md                                    ← Quick start
```

---

## 💡 Next Steps After These 3 Tasks

Once you've completed the onboarding tasks:

1. **Implement PO Backend APIs** (using your design document as a contract)
2. **Build PO Frontend Pages** (list, create, detail)
3. **Write Jest Tests** for PO business rules
4. **Write Playwright E2E Tests** for PO workflow with baseline PR data
5. **Open a Pull Request** for code review
6. **Explore GR Module** (optional, self-paced)
7. **Implement Bookmark Feature** (if time allows)

---

## 🤝 How to Use Copilot in This Workshop

Copilot is your pair programmer. Use it for:

- **Requirements** → Turn business rules into strict acceptance criteria
- **Design** → Generate API endpoint skeletons and data validation logic
- **Build** → Scaffold route handlers, service methods, and Vue components
- **Test** → Generate Jest test cases and Playwright scenarios
- **Refactor** → Improve naming, add error handling, optimize queries

**Pro tip:** When you ask Copilot, reference the plan document:
> "Using the PO module design from docs/plan.md, generate a Fastify route handler for POST /api/purchase-orders that validates allocation against PR lines."

---

## ❓ Common Questions

**Q: Why is the GR module out of scope?**  
A: We want to focus your learning on PO — a complete, realistic module. GR patterns are similar, so you can tackle it independently after the workshop.

**Q: Can I modify the PR module baseline?**  
A: No — treat it as a reference implementation. Focus entirely on PO to keep scope tight and demonstrate mastery of one full domain.

**Q: What if the database won't start?**  
A: See README.md "Troubleshooting: DB init failed" section. Most common fix:
```bash
chmod +x docker/postgres/init/00-init-mvp-db.sh
docker compose down -v
docker compose up -d db
```

**Q: Do I need to write 100% test coverage?**  
A: No — write meaningful tests that exercise your business logic. Minimum: 1 Jest test per validation rule, 1 Playwright flow covering PO end-to-end.

---

## 📞 Getting Help

1. **Schema questions** → Check `docs/plan.md` Section 5 (Data Model)
2. **API design** → Reference `docs/plan.md` Section 4 (API Scope)
3. **Business rules** → See `docs/plan.md` Section 5.3 (Rule Mapping)
4. **Copilot help** → Ask Copilot and reference the `docs/` folder in your prompt
5. **Implementation examples** → Study the baseline PR module in `backend/src/routes/requisitions.js`

---

## ✅ Onboarding Checklist

- [ ] Repository cloned locally
- [ ] Docker and PostgreSQL running
- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] PR module smoke test passed (can view sample PRs)
- [ ] Reviewed data model in `db/migrations/001_init_procurement_mvp.sql`
- [ ] Reviewed business rules in `docs/plan.md` Section 5.3
- [ ] Explored PR API endpoints in backend code
- [ ] Created `docs/PO_MODULE_DESIGN.md` with PO API design
- [ ] Ready to start Task 4: Implement PO Backend APIs

**Once all boxes are checked, you're ready to contribute!** 🎉

---

**Last updated:** 2026-09-02  
**Next review:** After first PO implementation sprint
