# AI Delivery Control Surface

Static HTML prototype for Phase 5 and Phase 6 of an AI development pipeline.

Current scope:
- `index.html`: GitHub Pages entry point
- `server.js`: optional zero-dependency local Node server for shared JSON state
- Feature intake for internal beta requests
- Automatic versus gate-by-gate execution controls
- Task pipeline, workspace, diff/log, and PR explanation views
- Observability panels for throughput, success rate, token usage, cost, and review load

Run locally with backend state:

```bash
node server.js
```

Then open:

```text
http://127.0.0.1:4177
```

API surface:
- `GET /api/health`
- `GET /api/state`
- `POST /api/reset`
- `POST /api/mode`
- `POST /api/features`
- `POST /api/features/:id/activate`
- `POST /api/features/:id/run`
- `POST /api/features/:id/approve`

The page still falls back to browser `localStorage` when the API is not available, so the GitHub Pages version keeps working.

This is still a control-surface prototype. Live orchestration, CI streaming, real token accounting, actual PR creation, and multi-user auth are still follow-up work.
