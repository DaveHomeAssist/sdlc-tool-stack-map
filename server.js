const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 4177);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const STATE_FILE = path.join(DATA_DIR, "runtime-state.json");

const phaseBlueprints = [
  { key: "requirements", title: "Requirements and design", owner: "Claude-like", why: "Clarify scope, architecture, interfaces, and the test plan.", diff: 3, tokens: 9200, cost: 0.22, tests: "Planning review", log: "Generated implementation tasks, edge cases, and acceptance criteria." },
  { key: "implementation", title: "Implementation", owner: "Codex-like", why: "Patch the concrete files and preserve behavior outside the task boundary.", diff: 20, tokens: 12800, cost: 0.31, tests: "Unit + integration", log: "Applied targeted code changes and added task-scoped tests." },
  { key: "verification", title: "Verification", owner: "Codex-like", why: "Tighten the repair loop until the task is green and stable.", diff: 7, tokens: 6200, cost: 0.14, tests: "Lint + tests", log: "Ran checks, fixed failures, and refreshed the verification notes." },
  { key: "review", title: "Review and docs", owner: "Claude-like", why: "Check architectural fit, risk, migration concerns, and documentation impact.", diff: 5, tokens: 6900, cost: 0.16, tests: "Review only", log: "Generated risk analysis, rationale, and follow-up notes for humans." },
  { key: "pr", title: "PR packaging", owner: "Claude-like", why: "Produce the summary, rationale, risk analysis, and migration notes for approval.", diff: 4, tokens: 5100, cost: 0.11, tests: "PR copy", log: "Prepared the final PR packet and rollout guidance." }
];

function makeId() {
  return `req-${Math.random().toString(36).slice(2, 10)}`;
}

function createTasks(featureId, mode, title) {
  const boost = Math.min(Math.ceil((title || "").length / 20), 4);
  return phaseBlueprints.map((phase, index) => ({
    id: `${featureId}-${phase.key}`,
    title: phase.title,
    owner: phase.owner,
    why: phase.why,
    workspace: `${phase.key}/${featureId.slice(-4)}`,
    branch: `agent/${phase.key}/${featureId.slice(-5)}`,
    diff: phase.diff + boost + index,
    tokens: phase.tokens + (boost * 400),
    cost: Number((phase.cost + boost * 0.01).toFixed(2)),
    tests: phase.tests,
    log: phase.log,
    status: mode === "gate" ? (index === 0 ? "awaiting_approval" : "queued") : (index === 0 ? "running" : "queued")
  }));
}

function createFeature(data, mode) {
  const featureId = makeId();
  return {
    id: featureId,
    title: data.title,
    repo: data.repo,
    requestedBy: data.requestedBy || "Internal beta",
    risk: data.risk || "medium",
    outcome: data.outcome || "",
    acceptance: data.acceptance || "",
    migration: data.migration || "",
    tasks: createTasks(featureId, mode, data.title)
  };
}

function stepAuto(feature) {
  const running = feature.tasks.find((task) => task.status === "running");
  if (running) running.status = "completed";
  const next = feature.tasks.find((task) => task.status === "queued");
  if (next) next.status = "running";
}

function finishAuto(feature) {
  while (feature.tasks.some((task) => task.status === "running" || task.status === "queued")) {
    stepAuto(feature);
  }
}

function stepGate(feature) {
  const open = feature.tasks.find((task) => task.status === "awaiting_approval");
  if (open) open.status = "completed";
  const next = feature.tasks.find((task) => task.status === "queued");
  if (next) next.status = "awaiting_approval";
}

function createDefaultState() {
  const mode = "automatic";
  const a = createFeature({
    title: "Add tenant-specific API rate limiting",
    repo: "platform-api",
    requestedBy: "Joey / product",
    risk: "medium",
    outcome: "Public endpoints should enforce tenant-specific quotas and report operator-friendly telemetry.",
    acceptance: "Quota checks, overrides, and review docs are all green before PR.",
    migration: "Seed default quotas and release behind a flag."
  }, mode);
  finishAuto(a);

  const b = createFeature({
    title: "Repair async retry handling in worker jobs",
    repo: "worker-core",
    requestedBy: "Reliability team",
    risk: "high",
    outcome: "Stop duplicate retries while preserving queue telemetry and safe failure behavior.",
    acceptance: "Async edge cases covered and rollback notes included.",
    migration: "Keep retry envelope backward compatible."
  }, "gate");

  return {
    mode,
    activeFeatureId: a.id,
    features: [a, b]
  };
}

function ensureStateDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadState() {
  ensureStateDir();
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    const state = createDefaultState();
    saveState(state);
    return state;
  }
}

function saveState(state) {
  ensureStateDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, message) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(message);
}

function findFeature(state, featureId) {
  return state.features.find((feature) => feature.id === featureId) || null;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function updateMode(state, mode) {
  if (mode !== "automatic" && mode !== "gate") {
    return false;
  }
  state.mode = mode;
  return true;
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".png") return "image/png";
  if (ext === ".ico") return "image/x-icon";
  return "application/octet-stream";
}

function serveStatic(req, res, pathname) {
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const resolvedPath = path.resolve(ROOT, relativePath);
  if (!resolvedPath.startsWith(ROOT)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  let filePath = resolvedPath;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendText(res, 404, "Not found");
    return;
  }

  res.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
  fs.createReadStream(filePath).pipe(res);
}

async function handleApi(req, res, pathname) {
  const state = loadState();

  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, { status: "ok", source: "runtime-state.json" });
    return;
  }

  if (req.method === "GET" && pathname === "/api/state") {
    sendJson(res, 200, state);
    return;
  }

  if (req.method === "POST" && pathname === "/api/reset") {
    const next = createDefaultState();
    saveState(next);
    sendJson(res, 200, next);
    return;
  }

  if (req.method === "POST" && pathname === "/api/mode") {
    const body = await parseBody(req);
    if (!updateMode(state, body.mode)) {
      sendJson(res, 400, { error: "Invalid mode" });
      return;
    }
    saveState(state);
    sendJson(res, 200, state);
    return;
  }

  if (req.method === "POST" && pathname === "/api/features") {
    const body = await parseBody(req);
    if (!body.title || !body.repo) {
      sendJson(res, 400, { error: "title and repo are required" });
      return;
    }
    const feature = createFeature(body, state.mode);
    state.features.unshift(feature);
    state.activeFeatureId = feature.id;
    if (state.mode === "automatic") {
      stepAuto(feature);
    }
    saveState(state);
    sendJson(res, 200, state);
    return;
  }

  const featureMatch = pathname.match(/^\/api\/features\/([^/]+)\/(activate|run|approve)$/);
  if (req.method === "POST" && featureMatch) {
    const [, featureId, action] = featureMatch;
    const feature = findFeature(state, featureId);
    if (!feature) {
      sendJson(res, 404, { error: "Feature not found" });
      return;
    }

    state.activeFeatureId = feature.id;

    if (action === "activate") {
      saveState(state);
      sendJson(res, 200, state);
      return;
    }

    if (action === "run") {
      if (state.mode === "gate") {
        stepGate(feature);
      } else {
        finishAuto(feature);
      }
      saveState(state);
      sendJson(res, 200, state);
      return;
    }

    if (action === "approve") {
      if (state.mode === "gate") {
        stepGate(feature);
      }
      saveState(state);
      sendJson(res, 200, state);
      return;
    }
  }

  sendJson(res, 404, { error: "Unknown API route" });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url.pathname);
      return;
    }
    serveStatic(req, res, url.pathname);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Internal server error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`AI Delivery Control Surface server running at http://${HOST}:${PORT}`);
});
