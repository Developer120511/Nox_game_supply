#!/usr/bin/env node
/**
 * Sincroniza data.json (paquetes, ofertas y precios) y las portadas en assets/.
 * Se ejecuta en el servidor (GitHub Actions), nunca en el navegador del cliente.
 * La fuente está codificada y solo se resuelve en memoria en tiempo de ejecución.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const SOURCE = Buffer.from(
  process.env.CATALOG_SOURCE_B64 || "aHR0cHM6Ly9vZmljaWFsbmV4dGxldmVsLmNvbQ==",
  "base64"
).toString("utf8").replace(/\/+$/, "");

const RATE = { cup: 1120, saldo: 335 };
const OFFSET = { cup: 40, saldo: 20 };
const STEP = 5;

const GAME_META = [
  { id: "free-fire",       name: "Free Fire",       unit: "Diamantes",         img: "free-fire" },
  { id: "blood-strike",    name: "Blood Strike",    unit: "Gold (BC)",         img: "blood-strike" },
  { id: "mobile-legends",  name: "Mobile Legends",  unit: "Diamantes",         img: "mobile-legends" },
  { id: "arena-breakout",  name: "Arena Breakout",  unit: "Bonos",             img: "arena-breakout" },
  { id: "roblox",          name: "Roblox",          unit: "Robux",             img: "roblox", gift: true },
  { id: "honor-of-kings",  name: "Honor of Kings",  unit: "Tokens",            img: "honor-of-kings" },
  { id: "genshin-impact",  name: "Genshin Impact",  unit: "Cristales Génesis", img: "genshin-impact" },
  { id: "wuthering-waves", name: "Wuthering Waves", unit: "Lunite",            img: "wuthering-waves" },
];

const priceFor = (usd, cur) =>
  Math.round((usd * RATE[cur]) / STEP) * STEP + OFFSET[cur];

function toItem(p, kind) {
  const usd = Number(p.usd);
  if (!Number.isFinite(usd) || usd <= 0) return null;
  const name = String(p.label || "").trim();
  if (!name) return null;
  return {
    n: name,
    k: kind,
    d: p.descripcion || null,
    cup: priceFor(usd, "cup"),
    saldo: priceFor(usd, "saldo"),
  };
}

async function request(path, binary = false) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(SOURCE + path, {
      signal: ctrl.signal,
      headers: {
        Accept: binary ? "image/webp,image/*,*/*" : "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; catalog-sync/1.0)",
      },
    });
    if (!res.ok) throw new Error(path + " -> HTTP " + res.status);
    return binary ? Buffer.from(await res.arrayBuffer()) : await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const regionLabel = (regiones) => {
  const names = (regiones || []).map((r) => String(r.nombre || "").trim()).filter(Boolean);
  return names.length ? names.join(" · ") : "Global";
};

async function buildGame(meta) {
  if (meta.gift) {
    const d = await request("/api/giftcards/" + meta.id + "/products");
    const items = (d.products || []).filter((p) => !p.agotado).map((p) => toItem(p, "gc")).filter(Boolean);
    return { ...meta, reg: "Global", items };
  }
  const d = await request("/api/games/" + meta.id + "/todo");
  const items = (d.products || [])
    .map((p) => toItem(p, p.kind === "offer" ? "offer" : "coin"))
    .filter(Boolean);
  return { ...meta, reg: regionLabel(d.regiones), items };
}

async function syncCover(meta) {
  try {
    const buf = await request("/assets/games/" + meta.img + "-banner.webp?v=18", true);
    if (buf.length < 5000) throw new Error("imagen vacía");
    mkdirSync("assets", { recursive: true });
    const file = "assets/" + meta.img + ".webp";
    if (existsSync(file) && Buffer.compare(readFileSync(file), buf) === 0) return "igual";
    writeFileSync(file, buf);
    return "actualizada";
  } catch (e) {
    return "error: " + e.message;
  }
}

(async () => {
  const games = [];
  for (const meta of GAME_META) {
    try {
      const g = await buildGame(meta);
      if (g.items.length) games.push(g);
      console.log("datos " + meta.id.padEnd(16) + g.items.length + " paquetes");
    } catch (e) {
      console.log("datos " + meta.id.padEnd(16) + "error: " + e.message);
    }
  }
  if (games.length < 6) {
    console.error("Respuesta incompleta (" + games.length + " juegos). No se escriben cambios.");
    process.exit(1);
  }

  const out = JSON.stringify(games);
  if (existsSync("data.json") && readFileSync("data.json", "utf8").trim() === out) {
    console.log("data.json sin cambios");
  } else {
    writeFileSync("data.json", out);
    console.log("data.json actualizado · " + games.reduce((s, g) => s + g.items.length, 0) + " paquetes");
  }

  for (const meta of GAME_META) {
    console.log("arte  " + meta.id.padEnd(16) + (await syncCover(meta)));
  }
})().catch((e) => {
  console.error("fallo: " + e.message);
  process.exit(1);
});
