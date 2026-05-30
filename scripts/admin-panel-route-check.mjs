import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const appPath = resolve(root, "src/App.tsx");
const adminHomePath = resolve(root, "src/pages/admin/AdminHome.tsx");
const worldsAdminPath = resolve(root, "src/pages/admin/WorldsAdmin.tsx");
const worldsPath = resolve(root, "convex/worlds.ts");

const app = readFileSync(appPath, "utf8");
const worldsAdmin = readFileSync(worldsAdminPath, "utf8");
const worlds = readFileSync(worldsPath, "utf8");
const adminHome = existsSync(adminHomePath) ? readFileSync(adminHomePath, "utf8") : "";

const failures = [];

if (!existsSync(adminHomePath)) {
  failures.push("AdminHome page must exist at src/pages/admin/AdminHome.tsx.");
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
if (!worldsAdmin.includes("useUser") || !worldsAdmin.includes("api.users.getUser")) {
  failures.push("WorldsAdmin must check the signed-in user role.");
}
if (!/api\.worlds\.listForAdmin,[\s\S]*\{\s*userId:\s*user\.id\s*\}/.test(worldsAdmin)) {
  failures.push("WorldsAdmin must call listForAdmin with the Clerk user id.");
}
if (!/listForAdmin = query\(\{[\s\S]*args:\s*\{\s*userId:\s*v\.string\(\)/.test(worlds)) {
  failures.push("listForAdmin must require a userId argument.");
}
if (!/listForAdmin = query\(\{[\s\S]*role !== "admin"[\s\S]*Admin access required/.test(worlds)) {
  failures.push("listForAdmin must enforce admin role server-side.");
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Admin panel route check passed.");
