import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const appPath = resolve(root, "src/App.tsx");
const adminHomePath = resolve(root, "src/pages/admin/AdminHome.tsx");
const worldsAdminPath = resolve(root, "src/pages/admin/WorldsAdmin.tsx");
const worldsPath = resolve(root, "convex/worlds.ts");
const adminApiPath = resolve(root, "convex/admin.ts");

const app = readFileSync(appPath, "utf8");
const worldsAdmin = readFileSync(worldsAdminPath, "utf8");
const worlds = readFileSync(worldsPath, "utf8");
const adminHome = existsSync(adminHomePath) ? readFileSync(adminHomePath, "utf8") : "";
const adminApi = existsSync(adminApiPath) ? readFileSync(adminApiPath, "utf8") : "";

const failures = [];

if (!existsSync(adminHomePath)) {
  failures.push("AdminHome page must exist at src/pages/admin/AdminHome.tsx.");
}
if (!existsSync(adminApiPath)) {
  failures.push("Central admin API must exist at convex/admin.ts.");
}
if (!app.includes("import AdminHome from '@/pages/admin/AdminHome';")) {
  failures.push("App.tsx must import AdminHome.");
}
if (!app.includes("Navigate")) {
  failures.push("App.tsx must import Navigate for /backend alias.");
}
if (!app.includes('<Route path="/admin" element={<AdminHome />} />')) {
  failures.push("App.tsx must expose /admin as the admin panel.");
}
if (!app.includes('<Route path="/backend" element={<Navigate to="/admin" replace />} />')) {
  failures.push("App.tsx must expose /backend as an alias to /admin.");
}
if (!adminHome.includes('href: "/admin/worlds"') || !adminHome.includes('href: "/admin/site-studio"')) {
  failures.push("AdminHome must link to worlds admin and site studio.");
}
if (!adminHome.includes("api.users.getUser") || !adminHome.includes('role !== "admin"')) {
  failures.push("AdminHome must guard access with the Convex admin role.");
}
if (!adminHome.includes("api.admin.getOverview")) {
  failures.push("AdminHome must load the operations overview from api.admin.getOverview.");
}
for (const requiredCopy of [
  "Welten gesamt",
  "Letzte 24h",
  "Quality Score",
  "Achtung nötig",
  "Systemstatus",
  "Schnellzugriff",
]) {
  if (!adminHome.includes(requiredCopy)) {
    failures.push(`AdminHome must render '${requiredCopy}'.`);
  }
}
if (!worldsAdmin.includes("useUser") || !worldsAdmin.includes("api.users.getUser")) {
  failures.push("WorldsAdmin must check the signed-in user role.");
}
if (!/api\.admin\.listWorlds,[\s\S]*\{\s*userId:\s*user\.id\s*\}/.test(worldsAdmin)) {
  failures.push("WorldsAdmin must call api.admin.listWorlds with the Clerk user id.");
}
for (const requiredCopy of [
  "Status filtern",
  "Fach filtern",
  "Klasse filtern",
  "Quality",
  "Details",
  "Welt öffnen",
]) {
  if (!worldsAdmin.includes(requiredCopy)) {
    failures.push(`WorldsAdmin must render '${requiredCopy}'.`);
  }
}
if (!/listForAdmin = query\(\{[\s\S]*args:\s*\{\s*userId:\s*v\.string\(\)/.test(worlds)) {
  failures.push("listForAdmin must require a userId argument.");
}
if (!/listForAdmin = query\(\{[\s\S]*role !== "admin"[\s\S]*Admin access required/.test(worlds)) {
  failures.push("listForAdmin must enforce admin role server-side.");
}
if (!/async function assertAdmin/.test(adminApi) || !/role !== "admin"[\s\S]*Admin access required/.test(adminApi)) {
  failures.push("convex/admin.ts must use a shared assertAdmin guard.");
}
if (!/export const getOverview = query/.test(adminApi)) {
  failures.push("convex/admin.ts must export getOverview.");
}
if (!/export const listWorlds = query/.test(adminApi)) {
  failures.push("convex/admin.ts must export listWorlds.");
}
for (const requiredField of [
  "totalWorlds",
  "worldsLast24h",
  "averageQualityScore",
  "attentionWorlds",
  "serviceStatuses",
  "recentSessions",
]) {
  if (!adminApi.includes(requiredField)) {
    failures.push(`convex/admin.ts overview must include ${requiredField}.`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Admin panel route check passed.");
