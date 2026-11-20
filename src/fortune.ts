import { Solar } from "lunar-typescript";
export type Profile = {
  date: string;
  lunar: boolean;
  leap: boolean;
  hour: number;
};
const stems = "甲乙丙丁戊己庚辛壬癸",
  branches = "子丑寅卯辰巳午未申酉戌亥";
const hidden = [
  "癸",
  "己癸辛",
  "甲丙戊",
  "乙",
  "戊乙癸",
  "丙戊庚",
  "丁己",
  "己丁乙",
  "庚壬戊",
  "辛",
  "戊辛丁",
  "壬甲",
];
const names = [
    "비견",
    "겁재",
    "식신",
    "상관",
    "편재",
    "정재",
    "편관",
    "정관",
    "편인",
    "정인",
  ],
  weights = [-5, -12, 8, 2, 12, 14, -6, 6, -3, 3];
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
export function today() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(
    new Date(),
  );
}
export const hours = Array.from(
  branches,
  (_, i) =>
    String((23 + i * 2) % 24).padStart(2, "0") +
    ":30~" +
    String((1 + i * 2) % 24).padStart(2, "0") +
    ":29",
);
export function resolve(p: Profile) {
  const [y, m, d] = p.date.split("-").map(Number);
  if (y < 1900 || !Number.isInteger(d) || m < 1 || m > 12 || d < 1 || d > 31)
    throw Error("생년월일을 확인해줘.");
  let dt = new Date(Date.UTC(y, m - 1, d, 12));
  if (p.lunar) {
    const fmt = new Intl.DateTimeFormat("en-u-ca-dangi", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      timeZone: "Asia/Seoul",
    });
    let found = false;
    for (let i = 0; i < 100; i++) {
      const parts = Object.fromEntries(
        fmt.formatToParts(dt).map((v) => [v.type, v.value]),
      );
      if (
        +parts.relatedYear === y &&
        parseInt(parts.month) === m &&
        +parts.day === d &&
        parts.month.includes("bis") === p.leap
      ) {
        found = true;
        break;
      }
      dt = new Date(+dt + 86400000);
    }
    if (!found) throw Error("음력 날짜와 윤달 여부를 확인해줘.");
  } else if (dt.getUTCMonth() !== m - 1) throw Error("존재하지 않는 날짜야.");
  if (dt.toISOString().slice(0, 10) > today())
    throw Error("미래 날짜는 입력할 수 없어.");
  return dt;
}
function relation(a: number, b: number) {
  return (
    ((Math.floor(b / 2) - Math.floor(a / 2) + 5) % 5) * 2 +
    Number(a % 2 !== b % 2)
  );
}
export function fortune(p: Profile, date: string, key: string) {
  const birth = resolve(p),
    hour = p.hour < 0 ? 12 : p.hour * 2;
  // Solar-term timestamps in the bundled ephemeris use UTC+8.
  const moment = new Date(birth);
  moment.setUTCHours(hour - 1, 30);
  const natal = Solar.fromYmdHms(
    moment.getUTCFullYear(),
    moment.getUTCMonth() + 1,
    moment.getUTCDate(),
    moment.getUTCHours(),
    30,
    0,
  ).getLunar();
  const solar = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Solar.fromYmd(y, m, d).getLunar();
  };
  const day = solar(birth.toISOString().slice(0, 10)).getDayInGanZhi(),
    now = solar(date).getDayInGanZhi();
  const a = stems.indexOf(day[0]),
    b = stems.indexOf(now[0]),
    x = branches.indexOf(day[1]),
    z = branches.indexOf(now[1]),
    r = relation(a, b);
  const clash = (z + 6) % 12,
    harm = (19 - z) % 12,
    match = (13 - z) % 12;
  const punishment =
    ["子卯", "寅巳申", "丑戌未"].some(
      (group) => x !== z && group.includes(day[1]) && group.includes(now[1]),
    ) ||
    (x === z && "辰午酉亥".includes(day[1]));
  const modifier =
    x === clash ? -10 : punishment ? -6 : x === harm ? -5 : x === match ? 5 : 0;
  const pillars = [
    natal.getYearInGanZhiExact(),
    natal.getMonthInGanZhiExact(),
    day,
    ...(p.hour < 0
      ? []
      : [stems[((a % 5) * 2 + p.hour) % 10] + branches[p.hour]]),
  ];
  const elements = pillars
    .flatMap((s) => [s[0], ...hidden[branches.indexOf(s[1])]])
    .map((s) => Math.floor(stems.indexOf(s) / 2));
  const roots = Array.from(hidden[z], (s) => relation(a, stems.indexOf(s)));
  const score = clamp(
    Math.round(
      50 +
        weights[r] +
        [-3, -4, 2, -8, 6][r >> 1] +
        modifier +
        clamp(
          (roots.reduce((v, s) => v + weights[s], 0) / roots.length) * 0.6,
          -8,
          8,
        ) +
        (r >> 1 === 2 && !elements.includes(b >> 1) ? 5 : 0),
    ),
    0,
    100,
  );
  const defense = clamp(
    60 -
      [0, 12, 0, 8, 10, -6, 0, -5, 0, -3][r] -
      Math.min(
        10,
        Math.max(
          0,
          ...[1, 4].map((e) => elements.filter((v) => v === e).length - 3),
        ) * 2,
      ) -
      (roots.includes(4) ? 5 : 0),
    5,
    95,
  );
  let state = 2166136261;
  for (const c of key + p.date + date)
    state = Math.imul(state ^ c.charCodeAt(0), 16777619);
  const rand = () =>
    ((state = Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
  const nums = Array.from({ length: 45 }, (_, i) => i + 1);
  for (let i = 44; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  const band = [30, 45, 60, 75, 90, 101].findIndex((v) => score < v);
  const weekday = new Date(date + "T12:00:00Z").getUTCDay();
  const contexts = [
    "일요일 장보기 전",
    "월요일 출근 전",
    "화요일 점심 전",
    "수요일 외출 전",
    "목요일 퇴근 전",
    "금요일 약속 전",
    "토요일 쇼핑 전",
  ];
  const actions = [
    ["현금 1만 원만 챙겨.", "정기결제 1개를 확인해."],
    ["결제 전 10분만 기다려.", "장바구니 1개를 비워."],
    ["두 번째 결제는 내일로 미뤄.", "쿠폰 1장의 조건을 읽어."],
    ["오늘 쓸 한도 1개를 정해.", "영수증 1장을 확인해."],
    ["미뤄둔 정산 1건을 확인해.", "잠든 포인트 1곳을 찾아봐."],
    ["이번 주 저축 목표 1개를 적어.", "받을 돈 1건을 정리해."],
  ];
  const comment = contexts[weekday] + ", " + actions[band][(r + z) % 2];
  const element = Math.floor(b / 2);
  const luckColor = ["청록", "주황", "베이지", "은색", "남색"][element];
  const luckItem = ["나무 소품", "가죽 카드지갑", "손수건", "동전", "물병"][
    element
  ];
  return {
    score,
    defense,
    grade: [
      "완전 잠금",
      "새는 날",
      "흔들리는 날",
      "지킬 수 있는 날",
      "들어오는 날",
      "재물 대박",
    ][band],
    comment,
    stars: clamp(Math.round(score / 20), 1, 5),
    luckColor,
    luckItem,
    opportunity: hours[match],
    pillars,
    risk: [hours[clash], hours[harm]],
    basis: day + " 일주 × " + now + " 일진 · " + names[r],
    numbers: nums.slice(0, 6).sort((a, b) => a - b),
    avoid: [
      "배달 추가 주문",
      "구독 갱신",
      "야간 쇼핑",
      "충동 간식",
      "묶음 할인",
      "즉흥 택시",
    ]
      .filter((_, i) => nums[i] % 2 === 0)
      .concat(["온라인 특가", "앱 추가 결제", "편의점 행사"])
      .slice(0, 3),
    boost: [
      "안 쓰는 구독 1개를 확인해.",
      "지갑 속 영수증 3장을 정리해.",
      "오늘 결제 내역을 1번 확인해.",
    ][Math.floor(rand() * 3)],
  };
}
