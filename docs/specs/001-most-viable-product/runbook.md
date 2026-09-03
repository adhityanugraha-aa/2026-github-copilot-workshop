# PO Backlog Implementation Runbook

## Overview
This runbook provides a strict task sequence for implementing the Purchase Order (PO) module as the primary workshop backlog focus. Follow the phases and checkpoints sequentially.

**Reference docs**: `docs/plan.md` (MVP spec), `AGENTS.md` (quality standards)

---

## Phase Dependencies & Critical Path

```
Phase 1 (Services)
    ↓
Phase 2 (Routes) ──→ Can parallelize Phase 3 (Unit Tests) & Phase 4 (UI)
    ↓
Phase 4 (UI)
    ↓
Phase 5 (E2E Tests)
    ↓
Phase 6 (Quality Gates)
```

**Go/No-Go Gates**: Each phase must complete all checkpoints before proceeding.

---

## Phase 1: Backend Service Layer
**Checkpoint**: All service functions implemented and unit tested  
**Dependency**: Database seeded with approved requisitions  
**Files**: `backend/src/services/purchase-order-service.js`

### Task 1.1: Create Service Skeleton
- [ ] Create file: `backend/src/services/purchase-order-service.js`
- [ ] Export functions: `createPurchaseOrder`, `submitPurchaseOrder`, `getPurchaseOrderById`, `getOpenLines`
- [ ] Add JSDoc header to each function (@param, @returns, @throws)
- [ ] Stub each function (return null or throw NotImplementedError)

**Checkpoint 1.1**: File exists, all 4 functions exported with JSDoc

### Task 1.2: Implement createPurchaseOrder
**Rule**: Allocation qty ≤ PR line remaining qty (validate at create time)

```
Input: { vendor_name, po_lines: [{ pr_line_id, allocated_qty, item_code, item_name, unit_price, ... }] }
Logic:
  1. Validate vendor_name is non-empty
  2. For each po_line:
     a. Fetch pr_line by id
     b. Calculate remaining = pr_line.qty_requested - pr_line.qty_allocated
     c. If allocated_qty > remaining → throw 409 "Over-allocation"
  3. BEGIN TRANSACTION
  4. Insert purchase_orders (status=DRAFT, po_number auto-generated)
  5. Insert po_lines (qty_ordered=allocated_qty, qty_received=0)
  6. Insert pr_line_allocations (pr_line_id, po_line_id, allocated_qty)
  7. Update pr_lines SET qty_allocated = qty_allocated + allocated_qty
  8. COMMIT TRANSACTION
Output: { id, po_number, vendor_name, status: 'DRAFT', po_lines: [...], created_at }
Errors:
  - 400: Missing/invalid vendor_name
  - 404: pr_line_id not found
  - 409: Over-allocation (allocated_qty > remaining available)
  - 422: Invalid po_line data
```

- [ ] Implement transaction wrapper (use database connection/pool)
- [ ] Validate input (vendor_name, po_lines array)
- [ ] Fetch and validate each PR line
- [ ] Calculate remaining allocation
- [ ] Throw 409 if over-allocation detected
- [ ] Insert PO + lines + allocations atomically
- [ ] Update pr_lines.qty_allocated
- [ ] Return full PO object with generated po_number

**Checkpoint 1.2**: 
- Happy path test: create PO with valid allocation ✓
- Error test: reject over-allocation (409) ✓
- Coverage ≥80% ✓

### Task 1.3: Implement submitPurchaseOrder
**Rule**: Only DRAFT→SUBMITTED transition allowed

```
Input: po_id
Logic:
  1. Fetch PO by id
  2. If status != DRAFT → throw 409 "Cannot submit PO in {status} state"
  3. Update status = 'SUBMITTED'
Output: Updated PO object with status='SUBMITTED'
Errors:
  - 404: PO not found
  - 409: Invalid status transition
```

- [ ] Fetch PO by id
- [ ] Validate status is DRAFT
- [ ] Update status to SUBMITTED
- [ ] Return updated PO

**Checkpoint 1.3**:
- Happy path test: DRAFT→SUBMITTED succeeds ✓
- Error test: reject SUBMITTED→SUBMITTED (409) ✓
- Test coverage ✓

### Task 1.4: Implement getPurchaseOrderById
**Rule**: Fetch PO with full detail (header + lines + allocations)

```
Input: po_id
Logic:
  1. Fetch PO header
  2. Fetch po_lines joined with pr_line_allocations
  3. Format and return complete object
Output: { id, po_number, vendor_name, status, po_lines: [...], created_at, updated_at }
Errors:
  - 404: PO not found
```

- [ ] Fetch PO header by id
- [ ] Join po_lines with pr_line_allocations to get full context
- [ ] Format response
- [ ] Throw 404 if not found

**Checkpoint 1.4**:
- Happy path test: fetch known PO, validate structure ✓
- Error test: fetch non-existent PO (404) ✓

### Task 1.5: Implement getOpenLines
**Rule**: Return po_lines where qty_received < qty_ordered

```
Input: po_id
Logic:
  1. Fetch PO
  2. Query po_lines WHERE qty_received < qty_ordered
  3. Return array
Output: [{ id, line_no, item_code, item_name, qty_ordered, qty_received, uom, ... }]
Errors:
  - 404: PO not found
```

- [ ] Fetch PO by id (throw 404 if not found)
- [ ] Query po_lines with qty_received < qty_ordered filter
- [ ] Return array of open lines

**Checkpoint 1.5**:
- Test: fetch open lines from seeded PO ✓
- Test: seeded PO with full allocation has 0 open lines ✓

---

## Phase 2: Backend Route Handlers
**Checkpoint**: All 4 endpoints callable via HTTP; response format matches PR module  
**Dependency**: Phase 1 complete, database connection live  
**Files**: `backend/src/routes/purchase-order-routes.js`

### Task 2.1: Scaffold Route File
- [ ] Create: `backend/src/routes/purchase-order-routes.js`
- [ ] Define Fastify route registration function
- [ ] Register 4 routes (stubs only):
  - `POST /api/purchase-orders`
  - `POST /api/purchase-orders/:id/submit`
  - `GET /api/purchase-orders/:id`
  - `GET /api/purchase-orders/:id/open-lines`
- [ ] Import routes in `backend/src/app.js`
- [ ] Test with curl (routes exist, no 404)

**Checkpoint 2.1**: Routes registered; curl returns 501 or empty response

### Task 2.2: Implement POST /api/purchase-orders
**Response Format** (match PR module):
```json
{
  "success": true,
  "data": {
    "po": { id, po_number, vendor_name, status, po_lines, created_at }
  }
}
```

```
Handler:
  1. Extract req.body.vendor_name, req.body.po_lines
  2. Validate input (not empty, array format)
  3. Call purchaseOrderService.createPurchaseOrder()
  4. Return 201 + success response
  5. Catch errors and return 400/404/409/422 + error response
```

- [ ] Extract and validate request body
- [ ] Call service.createPurchaseOrder()
- [ ] Return 201 on success
- [ ] Return appropriate error code on failure
- [ ] Error response: `{ success: false, error: "message" }`

**Checkpoint 2.2**:
- Curl test: create PO successfully (201) ✓
- Curl test: reject over-allocation (409) ✓
- Curl test: invalid input (400) ✓

### Task 2.3: Implement POST /api/purchase-orders/:id/submit
```
Handler:
  1. Extract po_id from req.params.id
  2. Call purchaseOrderService.submitPurchaseOrder(po_id)
  3. Return 200 + success response
  4. Catch errors and return 404/409 + error response
```

- [ ] Extract po_id from params
- [ ] Call service.submitPurchaseOrder()
- [ ] Return 200 on success
- [ ] Return 404/409 on error

**Checkpoint 2.3**:
- Curl test: submit DRAFT PO (200) ✓
- Curl test: reject re-submission (409) ✓

### Task 2.4: Implement GET /api/purchase-orders/:id
```
Handler:
  1. Extract po_id from req.params.id
  2. Call purchaseOrderService.getPurchaseOrderById(po_id)
  3. Return 200 + success response
  4. Catch 404 and return error response
```

- [ ] Extract po_id from params
- [ ] Call service.getPurchaseOrderById()
- [ ] Return 200 on success
- [ ] Return 404 if not found

**Checkpoint 2.4**:
- Curl test: fetch existing PO (200) ✓
- Curl test: fetch non-existent PO (404) ✓

### Task 2.5: Implement GET /api/purchase-orders/:id/open-lines
```
Handler:
  1. Extract po_id from req.params.id
  2. Call purchaseOrderService.getOpenLines(po_id)
  3. Return 200 + success response with lines array
  4. Catch 404 and return error response
```

- [ ] Extract po_id from params
- [ ] Call service.getOpenLines()
- [ ] Return 200 + { success: true, data: { lines: [...] } }
- [ ] Return 404 if PO not found

**Checkpoint 2.5**:
- Curl test: fetch open lines (200) ✓
- Curl test: PO not found (404) ✓

---

## Phase 3: Backend Unit Tests
**Checkpoint**: All tests pass; ≥80% coverage for purchase-order-service.js  
**Dependency**: Phases 1–2 complete  
**Files**: `backend/tests/services/purchase-order-service.test.js`

### Task 3.1: Over-Allocation Validation Tests
- [ ] Test: Reject when sum(allocated_qty) > remaining available
- [ ] Test: Accept when allocated_qty = remaining available
- [ ] Test: Reject with 409 status + clear error message
- [ ] Test: Database unchanged on rejection (rollback)

**Checkpoint 3.1**: 3+ test cases pass; no test.skip() left

### Task 3.2: Status Transition Tests
- [ ] Test: DRAFT→SUBMITTED succeeds
- [ ] Test: SUBMITTED→SUBMITTED fails (409)
- [ ] Test: Invalid PO id returns 404
- [ ] Test: Updated PO reflects new status

**Checkpoint 3.2**: 3+ test cases pass

### Task 3.3: PR Line Allocation Tests
- [ ] Test: pr_lines.qty_allocated increments correctly
- [ ] Test: pr_line_allocations records created correctly
- [ ] Test: Concurrent allocations to same PR line sum correctly
- [ ] Test: Cannot allocate same PR line to multiple PO lines over-total

**Checkpoint 3.3**: 3+ test cases pass

### Task 3.4: Open Lines Query Tests
- [ ] Test: Empty open lines after full allocation
- [ ] Test: Partial open lines returned correctly
- [ ] Test: 0 open lines for non-existent PO returns 404
- [ ] Test: Received qty doesn't exceed ordered qty

**Checkpoint 3.4**: 3+ test cases pass

---

## Phase 4: Frontend Pages
**Checkpoint**: All pages render; navigation between pages works  
**Dependency**: Phase 2 complete; PO API endpoints live  
**Files**: 
- `frontend/src/pages/PurchaseOrderListPage.vue`
- `frontend/src/pages/PurchaseOrderCreatePage.vue`
- `frontend/src/pages/PurchaseOrderDetailPage.vue`

### Task 4.1: Create PO List Page
**File**: `frontend/src/pages/PurchaseOrderListPage.vue`

- [ ] Component: Create Vue component with template + script + style
- [ ] Lifecycle: On mount, fetch PO list from GET /api/purchase-orders
- [ ] Display: Table with po_number, vendor_name, status, created_at, actions
- [ ] Actions: Click row → navigate to detail; "Create" button → create page
- [ ] Error handling: Display error message if fetch fails
- [ ] Style: Match PR list page CSS (use baseline variables)

**Checkpoint 4.1**: Page renders, list fetched and displayed, navigation works

### Task 4.2: Create PO Create Page
**File**: `frontend/src/pages/PurchaseOrderCreatePage.vue`

- [ ] Component: Vue component with form
- [ ] Form fields: 
  - Vendor name (text input)
  - Select PR lines (from GET /api/requisitions/:id/open-lines or list view)
  - For each line: input allocated qty with validation hint (show remaining available)
- [ ] Validation: Display error if allocated_qty > remaining
- [ ] Submit: POST /api/purchase-orders → redirect to detail page on success
- [ ] Error: Display server error message if over-allocation or other 400/409/422 returned
- [ ] Style: Match PR create page

**Checkpoint 4.2**: Form renders, PR lines fetched, validation works, submission successful

### Task 4.3: Create PO Detail Page
**File**: `frontend/src/pages/PurchaseOrderDetailPage.vue`

- [ ] Component: Vue component with PO header + lines table
- [ ] Header: po_number, vendor_name, status, created_at
- [ ] Lines table: item_code, item_name, qty_ordered, qty_received, uom, unit_price, line_no
- [ ] Actions: "Submit" button (visible only if status=DRAFT)
- [ ] Submit flow: 
  - POST /api/purchase-orders/:id/submit
  - Update status in UI to SUBMITTED
  - Disable "Submit" button
  - Show success message
- [ ] Error: Display server error if transition fails (409)
- [ ] Fetch: GET /api/purchase-orders/:id on mount
- [ ] Style: Match PR detail page

**Checkpoint 4.3**: Page renders with correct data; submit button works; status updates

### Task 4.4: Update Router
**File**: `frontend/src/router/index.js`

- [ ] Add routes:
  - `/purchase-orders` → PurchaseOrderListPage
  - `/purchase-orders/new` → PurchaseOrderCreatePage
  - `/purchase-orders/:id` → PurchaseOrderDetailPage
- [ ] Add navigation links in Dashboard/Navigation to point to PO list
- [ ] Verify no 404 errors when navigating

**Checkpoint 4.4**: All routes accessible from browser

### Task 4.5: Style Consistency
- [ ] Review PO pages CSS
- [ ] Use baseline CSS variables (colors, spacing, typography)
- [ ] Match PR page button/table/form styling
- [ ] No inline styles; add to `src/styles.css` if new styles needed
- [ ] Verify visual consistency across PR and PO modules

**Checkpoint 4.5**: Visual inspection; consistent with baseline

---

## Phase 5: End-to-End Testing (Playwright)
**Checkpoint**: Full PO workflow testable; error scenarios covered  
**Dependency**: Phase 4 complete; all pages live  
**Files**: `tests/po-flow.spec.js` (new) or extend existing test file

### Task 5.1: Playwright Setup
- [ ] Create test file: `tests/po-flow.spec.js`
- [ ] Setup: Seed database with 1+ approved PR with open lines
- [ ] Base URL: use VITE_API_BASE_URL from .env
- [ ] Teardown: Clean database after each test (or use transactions)

**Checkpoint 5.1**: Test file exists, seeding works

### Task 5.2: Test PO Create-from-PR Flow
```
Scenario:
  1. Approved PR line exists with qty_requested=100, qty_allocated=0
  2. Navigate to PO Create page
  3. Select PR line
  4. Enter allocated_qty=50
  5. Submit → PO created
  6. Verify redirect to detail page
  7. Verify detail page shows correct line allocation
  8. Verify database: po_lines.qty_ordered=50, pr_lines.qty_allocated=50
```

- [ ] Start from PO list page (or dashboard)
- [ ] Click "Create PO"
- [ ] Select approved PR line
- [ ] Enter allocation qty ≤ remaining
- [ ] Submit form
- [ ] Verify success (redirect + detail page loads)
- [ ] Verify allocated qty displayed correctly

**Checkpoint 5.2**: Test passes; PO created in database

### Task 5.3: Test Allocation Validation Error
```
Scenario:
  1. Approved PR line exists with qty_requested=100, qty_allocated=0
  2. Navigate to PO Create page
  3. Select PR line
  4. Enter allocated_qty=150 (over-allocation)
  5. Submit → error displayed, no PO created
```

- [ ] Navigate to PO Create page
- [ ] Try to allocate qty > remaining available
- [ ] Verify form/server rejects (error message displayed)
- [ ] Verify PO NOT created (check database)
- [ ] Verify pr_lines.qty_allocated unchanged

**Checkpoint 5.3**: Test passes; validation works; database unchanged

### Task 5.4: Test PO Submit Flow
```
Scenario:
  1. PO exists in DRAFT state
  2. Navigate to PO detail page
  3. Click "Submit PO"
  4. Status updates to SUBMITTED
  5. Try to click submit again → error (already submitted)
```

- [ ] Create PO in DRAFT state (can use API or UI from 5.2)
- [ ] Navigate to detail page
- [ ] Verify "Submit" button visible
- [ ] Click "Submit"
- [ ] Verify status changes to SUBMITTED in UI
- [ ] Verify "Submit" button disabled
- [ ] Verify database: po.status='SUBMITTED'

**Checkpoint 5.4**: Test passes; transition visible in UI

### Task 5.5: Test PO List Integration
```
Scenario:
  1. Create 2+ POs with different statuses
  2. Navigate to PO list page
  3. Verify all POs displayed with correct status/vendor
  4. Click row → detail page loads with correct data
  5. Click "Create" → new PO form loads
```

- [ ] Create multiple POs (via API or previous tests)
- [ ] Navigate to PO list page
- [ ] Verify all POs visible with correct columns
- [ ] Click a row → navigate to detail (correct PO loaded)
- [ ] Navigate back to list
- [ ] Click "Create" button → create page loads

**Checkpoint 5.5**: Test passes; list-detail-create loop works

---

## Phase 6: Quality Gates & Documentation
**Checkpoint**: All code passes AGENTS.md checklists; ready for review  
**Dependency**: All previous phases complete

### Task 6.1: Implementation Quality Checklist
**Reference**: `AGENTS.md` → Implementation Quality Checklist

- [ ] All request inputs validated (type, range, required fields)
  - POST /api/purchase-orders: vendor_name non-empty, po_lines is array
  - PO service: validate pr_line_id exists, allocated_qty is positive number
- [ ] Errors return appropriate HTTP status codes
  - 400: Bad request (malformed input, missing required fields)
  - 404: Not found (pr_line_id, po_id)
  - 409: Conflict (over-allocation, invalid status transition)
  - 422: Unprocessable entity (invalid data types)
  - 500: Server error (unhandled exceptions)
- [ ] Business rule violations caught with clear messages
  - Over-allocation: "Cannot allocate X units; only Y remaining"
  - Status transition: "Cannot submit PO in SUBMITTED state"
- [ ] Database transactions wrap multi-step operations
  - createPurchaseOrder: PO + lines + allocations + pr_lines update all in one transaction
- [ ] No hardcoded values; use config/constants
  - Status strings (DRAFT, SUBMITTED) as constants
  - No magic numbers in validation
- [ ] No console.log() in production code
  - Review all service and route files
  - Use structured logging if needed (server logs, not console)
- [ ] SQL queries parameterized (no injection risk)
  - All DB queries use prepared statements (pool.query with $1, $2, etc.)
- [ ] API response structure consistent with PR module
  - Success: `{ success: true, data: { po: {...} } }`
  - Error: `{ success: false, error: "message" }`

**Checkpoint 6.1**: All 8 items verified ✓

### Task 6.2: Testing Checklist
**Reference**: `AGENTS.md` → Testing Checklist

- [ ] Unit tests cover all PO service business rules
  - createPurchaseOrder (allocation validation)
  - submitPurchaseOrder (status transition)
  - getPurchaseOrderById (fetch + format)
  - getOpenLines (filter query)
- [ ] Unit tests: happy path + ≥2 error scenarios per function
  - Happy: valid input → success
  - Error 1: invalid input → error
  - Error 2: business rule violation → error
- [ ] Unit test coverage ≥80% for purchase-order-service.js
  - Run: `npm run test -- --coverage backend/src/services/purchase-order-service.js`
  - Verify lines covered ≥80%
- [ ] E2E test covers: create → allocate → submit workflow
  - Test 5.2: create PO from PR line (allocation step)
  - Test 5.4: submit PO
- [ ] E2E test includes validation error scenario (over-allocation)
  - Test 5.3: allocate qty > remaining → error
- [ ] Tests pass locally
  - `npm run test` (backend) → all pass ✓
  - `npx playwright test` (frontend) → all pass ✓
- [ ] No test.skip() or test.only() left
  - Grep for "test.skip" and "test.only" in test files
  - Remove or comment out if found
- [ ] Database clean before test run
  - Use transaction rollback per test
  - Or seed fresh database before test suite

**Checkpoint 6.2**: All 8 items verified ✓

### Task 6.3: Documentation Checklist
**Reference**: `AGENTS.md` → Documentation Checklist

- [ ] Route handlers have JSDoc comment explaining endpoint purpose
  ```javascript
  /**
   * Create a new purchase order by allocating quantities from approved PR lines.
   * @param {Object} request - Fastify request object with body: { vendor_name, po_lines }
   * @param {Object} reply - Fastify reply object
   */
  ```
- [ ] Complex business rules have inline comments
  - Allocation validation in createPurchaseOrder
  - Transaction logic
  - Status transition validation
- [ ] Service functions have JSDoc with @param, @returns, @throws
  ```javascript
  /**
   * Create a purchase order with allocations from PR lines.
   * @param {Object} poData - { vendor_name, po_lines: [{ pr_line_id, allocated_qty, ... }] }
   * @returns {Promise<Object>} Created PO object with id, po_number, status, po_lines
   * @throws {Error} 400, 404, 409, 422 with descriptive message
   */
  ```
- [ ] API endpoints documented in docs/api.md (or update docs/plan.md)
  - Endpoint: POST /api/purchase-orders
  - Request/response format
  - Error scenarios
  - (Same for other 3 endpoints)
- [ ] PR description includes: what/why/testing/breaking changes
  - What: "Implement PO module (create, submit, detail, open-lines)"
  - Why: "Workshop backlog focus; enables PR→PO workflow"
  - Testing: "Unit tests ≥80% coverage; E2E workflow tested"
  - Breaking: "None"
- [ ] Vue components have comments explaining props/emits/key logic
  - Explain component purpose
  - Document props (if any)
  - Document emits (if any)
  - Comment complex logic (validation, state transitions)
- [ ] README updated if new setup steps/dependencies added
  - New npm packages? → update package.json, list in README
  - New env vars? → document in README

**Checkpoint 6.3**: All 7 items verified ✓

### Task 6.4: Code Cleanup & Commit
- [ ] No console.log() or debug code left
  - Search workspace for console.log, debugger, test breakpoints
  - Remove or convert to structured logging
- [ ] No commented-out sections
  - Remove TODOs and commented code
  - Keep only necessary comments
- [ ] No test.skip() or test.only() in test files
  - Verify all tests run
- [ ] Commit message follows convention
  - Format: `feat: implement PO backlog (create/submit/detail/open-lines)`
  - Include reference to plan.md section
- [ ] Code review ready
  - All tests passing
  - All checklists verified
  - Code style consistent

**Checkpoint 6.4**: Code ready for PR submission ✓

---

## Success Criteria (Definition of Done)

- ✓ All 4 PO API endpoints (`POST /api/purchase-orders`, `POST /api/purchase-orders/:id/submit`, `GET /api/purchase-orders/:id`, `GET /api/purchase-orders/:id/open-lines`) callable and return correct status codes
- ✓ Allocation validation rejects over-allocation with 409 + clear message
- ✓ Status transitions enforce DRAFT→SUBMITTED only (409 on invalid transition)
- ✓ PO list/create/detail pages render and navigate correctly
- ✓ E2E workflow: Approved PR → Create PO → Allocate lines → Submit PO → Verify detail page updates
- ✓ Unit tests ≥80% coverage for `purchase-order-service.js`
- ✓ E2E tests include happy path (create + submit) + error scenario (over-allocation)
- ✓ All code passes AGENTS.md implementation/testing/documentation checklists
- ✓ No test.skip(), console.log(), or commented-out code left in production code
- ✓ Tests pass: `npm run test` (exit code 0) and `npx playwright test` (exit code 0)
- ✓ PR description and commit message complete and clear

---

## Troubleshooting & Common Issues

### Over-Allocation Not Rejected
- **Cause**: Allocation validation missing or calculated incorrectly
- **Fix**: Verify formula: `remaining = pr_line.qty_requested - pr_line.qty_allocated`
- **Verify**: Test 3.1 should reject allocation > remaining

### PR Line Qty Not Updating
- **Cause**: Transaction not committed or UPDATE missing
- **Fix**: Verify `UPDATE pr_lines SET qty_allocated = qty_allocated + ?` in createPurchaseOrder
- **Verify**: Test 3.3 checks pr_lines.qty_allocated increment

### Status Transition Allows Invalid Transitions
- **Cause**: Status validation missing in submitPurchaseOrder
- **Fix**: Verify check: `if (po.status !== 'DRAFT') throw new Error(...)`
- **Verify**: Test 3.2 rejects SUBMITTED→SUBMITTED

### E2E Tests Fail Due to Database State
- **Cause**: Previous test data not cleaned up
- **Fix**: Use transactions/rollback or seed fresh before each test
- **Verify**: Test 5.1 setup ensures clean database

### API Response Format Mismatch
- **Cause**: Response doesn't match `{ success: true, data: {...} }` format
- **Fix**: Compare with PR module responses in code or via curl
- **Verify**: Test 2.2 validates response structure

---

## Phase-by-Phase Execution Checklist

| Phase | Tasks | Go/No-Go |
|-------|-------|----------|
| 1 | Services (1.1–1.5) | ☐ All 5 checkpoints passed |
| 2 | Routes (2.1–2.5) | ☐ All 5 checkpoints passed |
| 3 | Unit Tests (3.1–3.4) | ☐ ≥80% coverage verified |
| 4 | Frontend Pages (4.1–4.5) | ☐ All 5 checkpoints passed |
| 5 | E2E Tests (5.1–5.5) | ☐ All 5 test scenarios pass |
| 6 | Quality Gates (6.1–6.4) | ☐ All checklists verified |

---

## References

- **MVP Plan**: `docs/plan.md`
- **Quality Standards**: `AGENTS.md`
- **API Schema**: `db/migrations/001_init_procurement_mvp.sql`
- **Seed Data**: `db/seeds/002_seed_procurement_mvp.sql`
- **Baseline PR Module**: `backend/src/services/requisition-service.js`, `backend/src/routes/requisition-routes.js`, `frontend/src/pages/Requisition*.vue`
