# Copilot Instructions for This Workshop

## Objective
Build a procurement management system with core modules for Purchase Requisition (PR), Purchase Order (PO), and Goods Receipt (GR).
A procurement system manages how a company buys things, with control and traceability from request to receiving.

The modules for a MVP (minimum viable product) procurement system include:
- **Purchase Requisition (PR)**: Employees request items/services, which are reviewed and approved by managers.
- **Purchase Order (PO)**: Approved requisitions are converted into purchase orders sent to suppliers, tracking order details and status.
- **Goods Receipt (GR)**: When items are delivered, a goods receipt is created to confirm what was received, update inventory, and trigger payment.

In this workshop, we focus on using a prebuilt baseline and a add a backlog sprint.

Reference plan: `docs/plan.md`.

## Scope Constraints (Strict)
- Baseline provided in repo: database schema + Home/Dashboard + PR module (list/create/detail + required PR APIs).
- Participant implementation scope: PO module only (PO list/create/detail + PO APIs + PO validations).
- GR module is out of implementation scope during the workshop and treated as further exploration.
- Keep business scope minimal and teachable.
- Avoid enterprise-only features (SSO, workflow engine, reporting, notifications, advanced compliance).
- Prefer clarity and small modules over abstraction-heavy architecture.

## Technology Decisions (Do Not Change)
- Backend: Fastify + JavaScript
- API style: REST JSON
- Database: PostgreSQL (Docker local)
- Frontend: Vue 3 + Vite + JavaScript
- Unit test: Jest
- E2E test: Playwright
- Do not use Prisma.

## API Requirements
- Maintain compatibility with endpoints listed in `docs/plan.md`.
- For participant backlog, prioritize PO endpoints:
	- `POST /api/purchase-orders`
	- `POST /api/purchase-orders/:id/submit`
	- `GET /api/purchase-orders/:id`
	- `GET /api/purchase-orders/:id/open-lines`
- Enforce PO rule: allocation qty <= PR line remaining qty.
- GR endpoints/rules can be left untouched during workshop implementation.

## Code Style Guidance
- Keep files short and readable for workshop participants.
- Use explicit naming; avoid clever patterns.
- Include basic request validation and clear error responses.
- Favor service functions for business rules and thin route handlers.

## Testing Expectations
- Add focused Jest tests for PO business validations (especially over-allocation and status transition).
- Add Playwright coverage focused on PO pages/flow integrated with existing baseline PR data.
- Do not over-invest in test framework complexity.

## User Interface Guidelines
- Follow the existing UI patterns established in the baseline for consistency.
- Always respect the CSS variables set in the baseline for colors, spacing, and typography.
- Never use emojis in the UI or commit messages. Create a custom SVG icon if needed for visual emphasis.

## Optional Extension
- Bookmark feature (PR|PO|GR) is an optional post-backlog exercise and should be driven via GitHub Issue creation workflow.

## Workshop-First Principle
When there is a trade-off between production robustness and workshop clarity, choose workshop clarity.

## Rules
- [ ] Always check docs/plan.md before large changes
- [ ] Add tests for new logic
- [ ] Use descriptive naming
- [ ] Update docs when introducing new flows

## Implementation Quality Checklist
Before marking work complete, verify:
- [ ] All request inputs are validated (type, range, required fields)
- [ ] Errors return appropriate HTTP status codes (400, 404, 409, 422, 500)
- [ ] Business rule violations (e.g., over-allocation) are caught with clear error messages
- [ ] Database transactions wrap multi-step operations (create PO + allocate lines)
- [ ] No hardcoded values; use config or constants for magic numbers
- [ ] No console.log() left in production code; use structured logging if needed
- [ ] SQL queries protect against injection (parameterized queries)
- [ ] API response structure is consistent (success/error format matches PR module)

## Testing Checklist
Before submitting for review:
- [ ] Unit tests cover all PO service business rules (allocation, status transitions)
- [ ] Unit tests include happy path + at least 2 error scenarios per function
- [ ] Unit test coverage ≥ 80% for new service files
- [ ] E2E test covers: create PO → allocate lines → submit workflow
- [ ] E2E test includes validation error scenario (over-allocation)
- [ ] Tests pass locally: `npm run test` (backend) and `npx playwright test` (frontend)
- [ ] No test.skip() or test.only() left in committed code
- [ ] Database is clean before test run (seeds applied or transactions rolled back)

## Documentation Checklist
Before merging:
- [ ] Route handler has JSDoc comment explaining endpoint purpose
- [ ] Complex business rules have inline comments (allocation logic, validation)
- [ ] Service functions have JSDoc with @param, @returns, @throws
- [ ] API endpoint documented in docs/api.md (or equivalent) if it doesn't exist
- [ ] PR description includes: what changed, why, testing performed, any breaking changes
- [ ] Vue components have comment explaining props, emits, and key logic
- [ ] README updated if new setup steps or dependencies added

## Token optimization

<!-- rtk-instructions v2 -->

### RTK – Token-Optimized CLI

**rtk** is a CLI proxy that filters and compresses command outputs, saving 60–90% tokens.

#### Rule

Always prefix shell commands with `rtk`:

```bash
# Instead of:                    Use:
git status                       rtk git status
git log -10                      rtk git log -10
docker ps                        rtk docker ps
```

Other examples where you can use rtk:

```bash
rtk tree
rtk ls -la
rtk read
rtk grep
rtk rg
rtk npm run test
rtk curl <url>
```

<!-- /rtk-instructions -->

## Codebase Context & Knowledge Graph Protocol

You have access to a pre-computed AST knowledge graph of this repository at `graphify-out/graph.json`. To minimize context window clutter, prevent hallucinations, and accurately map cross-file dependencies, you MUST follow these routing rules:

1. **Consult the Graph First:** Before writing plans, making sweeping structural modifications, or tracing function call blast-radii, read `graphify-out/graph.json`. Filter nodes to only those whose `id` paths start with `backend/` or `frontend/src/` — nodes from `playwright-report/`, `test-results/`, and `coverage/` are minified build artifacts and must be ignored.
2. **Identify God Nodes:** Rank nodes by edge degree. The highest-degree nodes are the structural hubs (e.g., service files, route registries). Avoid duplicating responsibilities already owned by a god node.
3. **Trace Structural Paths:** If the user asks about relationships between modules or layers (e.g., how the API layer reaches the DB), do not grep blindly. Traverse the `links` array in `graph.json` to find the actual dependency path.
4. **Graph State:** The graph is derived strictly via AST extraction — no documentation or semantic layer. Treat all node hierarchies and import edges as 100% extracted truth (`EXTRACTED` confidence tier). Do not infer structure that isn't in the graph.