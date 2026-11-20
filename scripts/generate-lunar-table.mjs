// Freeze Korean Dangi month boundaries at build time so WebView ICU is irrelevant.
import { writeFileSync } from "node:fs";
const format = new Intl.DateTimeFormat("en-u-ca-dangi", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "Asia/Seoul",
});
if (format.resolvedOptions().calendar !== "dangi")
  throw Error("Korean Dangi calendar required");
const rows = [];
let prev;
for (
  let t = Date.UTC(1900, 0, 1, 12);
  t <= Date.UTC(2101, 3, 1, 12);
  t += 86400000
) {
  const parts = Object.fromEntries(
    format.formatToParts(t).map((v) => [v.type, v.value]),
  );
  if (parts.day !== "1") continue;
  if (prev) {
    const days = (t - prev.t) / 86400000;
    if (days !== 29 && days !== 30) throw Error("Invalid month length");
    prev.row[1] += days === 29 ? "0" : "1";
  }
  const year = Number(parts.relatedYear);
  if (year > 2100) break;
  if (year < 1900) continue;
  if (parts.month === "1")
    rows.push([new Date(t).toISOString().slice(0, 10), "", 0]);
  const row = rows[year - 1900];
  if (parts.month.includes("bis")) row[2] = parseInt(parts.month);
  prev = { row, t };
}
if (
  rows.length !== 201 ||
  rows.some(([, bits, leap]) => bits.length !== (leap ? 13 : 12))
)
  throw Error("Incomplete calendar");
writeFileSync(
  new URL("../src/lunar-years.json", import.meta.url),
  JSON.stringify(rows, null, 0) + "\n",
);
