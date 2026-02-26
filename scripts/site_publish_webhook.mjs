#!/usr/bin/env node
import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { execSync } from "node:child_process";

const PORT = Number(process.env.PORT || 8787);
const WEBHOOK_TOKEN = process.env.SITE_PUBLISH_WEBHOOK_TOKEN || "";
const REPO_ROOT = path.resolve(process.env.SITE_STUDIO_REPO_ROOT || process.cwd());
const TARGET_BRANCH = process.env.SITE_STUDIO_MAIN_BRANCH || "main";
const COMMIT_PREFIX = process.env.SITE_STUDIO_COMMIT_PREFIX || "site-studio";

function runGit(command) {
  return execSync(`git -C "${REPO_ROOT}" ${command}`, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf-8",
  }).trim();
}

function safeResolve(targetPath) {
  const resolved = path.resolve(REPO_ROOT, targetPath);
  if (!resolved.startsWith(REPO_ROOT)) {
    throw new Error("Unsafe file path.");
  }
  return resolved;
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) {
        reject(new Error("Payload too large."));
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

async function publishPage(payload) {
  const {
    filePath,
    fileContent,
    pageSlug,
    projectSlug,
    pageTitle,
    revisionId,
    approvalNote,
  } = payload;

  if (!filePath || !fileContent) {
    throw new Error("Missing filePath or fileContent.");
  }

  const absolutePath = safeResolve(filePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, String(fileContent), "utf-8");

  runGit("rev-parse --is-inside-work-tree");
  runGit(`checkout ${TARGET_BRANCH}`);
  runGit(`add -- "${filePath}"`);

  const normalizedProject = projectSlug || "site";
  const normalizedSlug = pageSlug || "page";
  const normalizedTitle = pageTitle || normalizedSlug;
  const shortRevision = revisionId ? String(revisionId).slice(0, 10) : "unknown";
  const note = approvalNote ? ` | ${String(approvalNote).slice(0, 120)}` : "";
  const message = `${COMMIT_PREFIX}: publish ${normalizedProject}/${normalizedSlug} (${shortRevision}) - ${normalizedTitle}${note}`;

  try {
    runGit(`commit -m "${message.replace(/"/g, "'")}"`);
  } catch (error) {
    const output = String(error?.stderr || "") + String(error?.stdout || "");
    if (!output.toLowerCase().includes("nothing to commit")) {
      throw error;
    }
  }

  runGit(`push origin ${TARGET_BRANCH}`);
  const commitSha = runGit("rev-parse HEAD");
  return { commitSha, paths: [filePath] };
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Bad request." }));
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method !== "POST" || req.url !== "/publish") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found." }));
    return;
  }

  if (WEBHOOK_TOKEN) {
    const auth = req.headers.authorization || "";
    if (auth !== `Bearer ${WEBHOOK_TOKEN}`) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized." }));
      return;
    }
  }

  try {
    const payload = await parseRequestBody(req);
    const result = await publishPage(payload);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Publish failed.",
      }),
    );
  }
});

server.listen(PORT, () => {
  process.stdout.write(
    `Site publish webhook listening on http://localhost:${PORT}/publish\n`,
  );
});

