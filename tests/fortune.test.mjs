import test from "node:test";
import assert from "node:assert/strict";
import { fortune, resolve } from "../src/fortune.ts";
const profile = { date: "1993-09-13", hour: -1, lunar: false, leap: false };
test("기획서 계산 예시와 당일 재현성", () => {
  const run = () => fortune(profile, "2026-11-20", "local");
  const f = run();
  assert.equal(f.score, 45);
  assert.equal(f.defense, 47);
  assert.deepEqual(f.risk, ["07:30~09:29", "17:30~19:29"]);
  assert.match(f.basis, /丁酉.*戊戌.*상관/);
  assert.equal(new Set(f.numbers).size, 6);
  for (let i = 0; i < 100; i++) assert.deepEqual(run(), f);
});
test("한국 음력 설날과 윤달 변환", () => {
  const convert = (date, leap = false) =>
    resolve({ ...profile, date, lunar: true, leap })
      .toISOString()
      .slice(0, 10);
  assert.equal(convert("2024-01-01"), "2024-02-10");
  assert.equal(convert("2023-02-01", true), "2023-03-22");
  assert.throws(() => convert("2024-02-01", true));
});
test("존재하지 않는 날짜 거부", () =>
  assert.throws(() => resolve({ ...profile, date: "1993-02-29" })));
