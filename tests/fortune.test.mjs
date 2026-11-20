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
test("한국 2012년 윤3월과 지원 연도", () => {
  assert.equal(
    resolve({ ...profile, date: "2012-03-01", lunar: true, leap: true })
      .toISOString()
      .slice(0, 10),
    "2012-04-21",
  );
  assert.throws(
    () => resolve({ ...profile, date: "2101-01-01", lunar: true }),
    /2100/,
  );
});
test("자시 일주는 KST 날짜, 입춘 전후 년월주는 절기 시각 기준", () => {
  const pillars = (hour) =>
    fortune({ ...profile, date: "2024-02-04", hour }, "2026-11-20", "x")
      .pillars;
  assert.deepEqual(pillars(0), ["癸卯", "乙丑", "戊戌", "壬子"]);
  assert.deepEqual(pillars(8).slice(0, 2), ["癸卯", "乙丑"]);
  assert.deepEqual(pillars(9).slice(0, 2), ["甲辰", "丙寅"]);
});
test("시간을 포함한 보너스 시드와 직전 7일 코멘트 중복 방지", () => {
  assert.notDeepEqual(
    fortune(profile, "2026-11-20", "a").numbers,
    fortune({ ...profile, hour: 0 }, "2026-11-20", "a").numbers,
  );
  const recent = [];
  for (let d = 0; d < 60; d++) {
    const result = fortune(
      profile,
      new Date(Date.UTC(2026, 0, 1 + d)).toISOString().slice(0, 10),
      "a",
    );
    assert.ok(!recent.includes(result.comment));
    recent.push(result.comment);
    if (recent.length > 7) recent.shift();
    assert.ok(result.percentile >= 1 && result.percentile <= 100);
  }
});
