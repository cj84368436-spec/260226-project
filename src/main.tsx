import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { getSafeAreaInsets } from "@apps-in-toss/web-framework";
import {
  Wallet,
  CalendarDays,
  Clock3,
  ArrowRight,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ArrowLeft,
  Gift,
  Check,
  Coins,
} from "lucide-react";
import { fortune, resolve, today, hours, type Profile } from "./fortune";
import { loadFullScreenAd, showFullScreenAd, supportsNativeAds } from "./ads";
import "./style.css";
import { store, seedKey } from "./storage";
function saved(raw: string | null): Profile | null {
  try {
    let p = JSON.parse(raw ?? "null");
    resolve(p);
    return p;
  } catch {
    return null;
  }
}
const labels = ["생년월일 입력", "오늘의 결과", "보너스 열기"];
function Art() {
  return (
    <div className="art" aria-hidden="true">
      <div className="aura" />
      <div className="spark s1">✦</div>
      <div className="spark s2">✧</div>
      <div className="spark s3">✦</div>
      <div className="walletart">
        <div className="walletback" />
        <div className="bill">
          <span>₩</span>
        </div>
        <div className="card" />
        <div className="front">
          <span>✦</span>
        </div>
        <div className="strap">
          <i />
        </div>
      </div>
      <div className="coin c1">₩</div>
      <div className="coin c2">₩</div>
    </div>
  );
}
function App({
  init,
  seed,
  initialDate,
  initialUnlock,
}: {
  init: Profile | null;
  seed: string;
  initialDate: string;
  initialUnlock: string | null;
}) {
  const [p, setP] = useState(init),
    [screen, S] = useState(init ? 1 : 0),
    [parts, setParts] = useState((init?.date || "--").split("-")),
    [lunar, L] = useState(init?.lunar || false),
    [leap, E] = useState(init?.leap || false),
    [hour, H] = useState(init?.hour ?? -1),
    [date] = useState(initialDate),
    [unlock, setUnlock] = useState(initialUnlock),
    [status, A] = useState("loading"),
    [note, N] = useState("");
  const [preloadAttempt, reloadAd] = React.useReducer((n: number) => n + 1, 0);
  const nativeAds = supportsNativeAds();
  const cancel = useRef<() => void>(),
    fields = useRef<(HTMLInputElement | null)[]>([]);
  const profile = { date: parts.join("-"), lunar, leap: lunar && leap, hour };
  let error = "";
  const complete = parts[0].length === 4 && !!parts[1] && !!parts[2];
  if (complete)
    try {
      resolve(profile);
    } catch (e) {
      error = (e as Error).message;
    }
  const result = React.useMemo(
      () => (p ? fortune(p, date, seed) : null),
      [p, date, seed],
    ),
    stamp = "unlocked:" + date,
    opened = unlock === JSON.stringify(p);
  useEffect(() => {
    try {
      for (const [edge, n] of Object.entries(getSafeAreaInsets()))
        document.documentElement.style.setProperty("--" + edge, n + "px");
    } catch {
      /* Browser previews use CSS safe-area-inset values. */
    }
    const timer = setInterval(() => {
      if (today() !== initialDate) location.reload();
    }, 15000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (screen === 0 || unlock) return;
    A("loading");
    return loadFullScreenAd({
      onEvent: () => A("ready"),
      onError: () => A("fallback"),
    });
  }, [screen === 1 || screen === 2, opened, date, preloadAttempt]);
  useEffect(() => {
    const back = () => {
      if (cancel.current) {
        history.pushState({}, "", "#bonus");
        if (!nativeAds) cancel.current();
        return;
      }
      const next = p ? 1 : 0;
      history.replaceState({}, "", next ? "#result" : "#input");
      S(next);
      N("");
    };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, [p]);
  function go(n: number) {
    history.pushState({}, "", "#" + ["input", "result", "bonus"][n]);
    S(n);
    N("");
    scrollTo(0, 0);
  }
  async function done(msg: string) {
    cancel.current = undefined;
    A("saving");
    try {
      await store.write(stamp, JSON.stringify(p));
    } catch {
      A("fallback");
      N("보너스 저장에 실패했어. 다시 시도해줘.");
      return;
    }
    setUnlock(JSON.stringify(p));
    history.replaceState({}, "", "#result");
    S(1);
    scrollTo(0, 0);
    N(msg);
  }
  function play() {
    if (status === "fallback") {
      done("광고 준비가 어려워 무료로 열었어.");
      return;
    }
    A("playing");
    cancel.current = showFullScreenAd({
      onEvent: (e) => {
        if (e.type === "dismissed") {
          cancel.current = undefined;
          A("loading");
          reloadAd();
          N("시청을 중단했어. 다시 시청할 수 있어.");
        } else
          done(
            e.type === "failedToShow"
              ? "광고 재생에 실패해 무료로 열었어."
              : "보너스 3개를 열었어.",
          );
      },
      onError: () => done("무료로 열었어."),
    });
  }
  return (
    <>
      <header>
        <div className="brand">
          <b>
            <Wallet size={21} />
          </b>
          오늘 지갑운
        </div>
        <div className="date">
          <CalendarDays size={15} />
          {date.replaceAll("-", ". ")}
        </div>
      </header>
      <main>
        <nav>
          {labels.map((v, i) => (
            <React.Fragment key={v}>
              {i > 0 && <i />}
              <span className={i === screen ? "active" : ""}>
                <b>{i < screen ? <Check size={12} /> : i + 1}</b>
                {v}
              </span>
            </React.Fragment>
          ))}
        </nav>
        <div className="layout">
          <aside>
            <div className="eyebrow">
              <span /> DAILY WALLET FORTUNE
            </div>
            <h1>
              오늘, 내 지갑의
              <br />
              <em>운세는?</em>
            </h1>
            <p>생년월일로 알아보는 오늘의 돈 씀씀이.</p>
            <Art />
            <div className="asidebottom">
              <Sparkles size={16} /> 매일 새롭게 열리는 나의 지갑운
            </div>
          </aside>
          <section>
            {screen === 0 ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!complete || error) return;
                  const v = {
                    ...profile,
                    date: parts
                      .map((n, i) => (i ? n.padStart(2, "0") : n))
                      .join("-"),
                  };
                  try {
                    await store.write("wallet_profile", JSON.stringify(v));
                  } catch {
                    N("프로필 저장에 실패했어. 다시 시도해줘.");
                    return;
                  }
                  setP(v);
                  history.replaceState({}, "", "#result");
                  S(1);
                }}
              >
                <div className="sectionicon">
                  <CalendarDays />
                </div>
                <h2>생년월일을 알려줘</h2>
                <p>태어난 날을 기준으로 지갑 운세를 계산해.</p>
                <label>생년월일</label>
                <div className="dates">
                  {parts.map((v, i) => (
                    <div key={i}>
                      <input
                        aria-label={
                          ["태어난 연도", "태어난 월", "태어난 일"][i]
                        }
                        ref={(el) => {
                          fields.current[i] = el;
                        }}
                        inputMode="numeric"
                        maxLength={i ? 2 : 4}
                        placeholder={["YYYY", "MM", "DD"][i]}
                        value={v}
                        onChange={(e) => {
                          const n = e.target.value.replace(/\D/g, "");
                          setParts(parts.map((x, j) => (i === j ? n : x)));
                          if (n.length === (i ? 2 : 4))
                            fields.current[i + 1]?.focus();
                        }}
                      />
                      <small>{"년월일"[i]}</small>
                    </div>
                  ))}
                </div>
                {error && <small role="alert">{error}</small>}
                <label>양력 · 음력</label>
                <div className="switch">
                  {["양력", "음력"].map((v, i) => (
                    <button
                      type="button"
                      aria-pressed={lunar === !!i}
                      className={lunar === !!i ? "selected" : ""}
                      onClick={() => L(!!i)}
                      key={v}
                    >
                      {lunar === !!i && <Check size={16} />} {v}
                    </button>
                  ))}
                </div>
                {lunar && (
                  <label>
                    <input
                      type="checkbox"
                      checked={leap}
                      onChange={(e) => E(e.target.checked)}
                    />{" "}
                    윤달
                  </label>
                )}
                <label htmlFor="hour">
                  태어난 시간 <small>선택</small>
                </label>
                <div className="select">
                  <Clock3 size={18} />
                  <select
                    id="hour"
                    value={hour}
                    onChange={(e) => H(+e.target.value)}
                  >
                    <option value={-1}>모름</option>
                    {hours.map((v, i) => (
                      <option key={v} value={i}>
                        {"자축인묘진사오미신유술해"[i]}시 · {v}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} />
                </div>
                <button className="cta" disabled={!complete || !!error}>
                  내 지갑 점수 보기 <ArrowRight size={19} />
                </button>
                <div className="sub">
                  <LockKeyhole size={13} /> 로그인 없이 바로 확인할 수 있어
                </div>
              </form>
            ) : screen === 1 && result ? (
              <>
                <div className="row">
                  <div className="sectionicon">
                    <ChartNoAxesColumnIncreasing />
                  </div>
                  <button className="link" onClick={() => go(0)}>
                    내 생일 변경
                  </button>
                </div>
                <h2>오늘의 지갑 점수</h2>
                <strong className="score">
                  {result.score}
                  <small> / 100</small>
                </strong>
                <h3>{result.grade}</h3>
                <small>
                  내 60일 주기 기준 하위 {result.percentile}% · 동점 포함
                </small>
                <p>{result.comment}</p>
                <div className="metrics">
                  <div>
                    소비 방어력<b>{result.defense}%</b>
                  </div>
                  <div>
                    재물 기운
                    <b>
                      {"★".repeat(result.stars) + "☆".repeat(5 - result.stars)}
                    </b>
                  </div>
                </div>
                <label>충동구매 위험 시간대</label>
                <p>{result.risk.join(" · ")}</p>
                <hr />
                {opened ? (
                  <>
                    <h3>오늘의 보너스</h3>
                    <label>행운 번호 6개</label>
                    <div className="nums">
                      {result.numbers.map((n) => (
                        <b key={n}>{n}</b>
                      ))}
                    </div>
                    <small>재미용 · 구매를 권하지 않습니다.</small>
                    <label>피해야 할 지출</label>
                    <p>{result.avoid.join(" · ")}</p>
                    <label>재물 부스터</label>
                    <p>{result.boost}</p>
                    <small>
                      기회 시간 {result.opportunity} · {result.luckColor} ·{" "}
                      {result.luckItem}
                    </small>
                  </>
                ) : unlock ? (
                  <p>오늘의 보너스는 처음 열었던 생일로 확인해.</p>
                ) : (
                  <>
                    <p>
                      <LockKeyhole size={14} /> 행운 번호 · 피해야 할 지출 ·
                      재물 부스터
                    </p>
                    <button className="cta" onClick={() => go(2)}>
                      {status === "fallback"
                        ? "무료로 보너스 열기"
                        : "광고 1회 보고 3개 열기"}{" "}
                      <ArrowRight size={17} />
                    </button>
                  </>
                )}
                {!nativeAds && (
                  <div className="adslot">
                    <small>Ad</small> 브라우저 테스트용 배너 광고
                  </div>
                )}
                <div className="sub">{result.basis}</div>
              </>
            ) : (
              <>
                <div className="sectionicon">
                  <Gift />
                </div>
                <h2>지금 열리는 것 3가지</h2>
                {[
                  "행운 번호 6개",
                  "피해야 할 지출 3개",
                  "오늘의 재물 부스터",
                ].map((v, i) => (
                  <h3 className="bonus" key={v}>
                    0{i + 1}　{v}
                  </h3>
                ))}
                <p>
                  {status === "fallback"
                    ? "오늘의 보너스 3개를 무료로 열 수 있어."
                    : nativeAds
                      ? "광고를 끝까지 보면 보너스 3개가 열려."
                      : "모의 광고 3초를 끝까지 보면 전부 열려."}
                  <br />
                  추가 광고와 결제는 없어.
                </p>
                <button
                  className="cta"
                  disabled={["loading", "playing", "saving"].includes(status)}
                  onClick={play}
                >
                  {
                    {
                      loading: "광고 준비 중…",
                      playing: nativeAds
                        ? "광고 재생 중…"
                        : "모의 광고 재생 중…",
                      saving: "보너스 저장 중…",
                      fallback: "무료로 열기",
                      ready: "광고 보고 열기",
                    }[status]
                  }
                </button>
                <button
                  className="back"
                  disabled={
                    status === "saving" || (nativeAds && status === "playing")
                  }
                  onClick={() => {
                    if (cancel.current) cancel.current();
                    else history.back();
                  }}
                >
                  <ArrowLeft size={15} />{" "}
                  {status === "playing" ? "광고 닫기" : "나중에 할래"}
                </button>
              </>
            )}
            {note && <p role="status">{note}</p>}
          </section>
        </div>
        {screen === 0 && (
          <article>
            <div>
              <Coins />
              <span>오늘의 지갑 점수</span>
            </div>
            <div>
              <ShieldCheck />
              <span>소비 방어력</span>
            </div>
            <div>
              <Clock3 />
              <span>충동구매 위험 시간</span>
            </div>
          </article>
        )}
        <footer>
          <ShieldCheck size={14} /> 재미로 보는 명리 콘텐츠입니다. 금융·투자
          자문이 아닙니다.
        </footer>
      </main>
    </>
  );
}
const root = createRoot(document.getElementById("root")!);
async function start() {
  const date = today();
  const [raw, seed, unlock] = await Promise.all([
    store.read("wallet_profile"),
    seedKey(),
    store.read("unlocked:" + date),
  ]);
  const init = saved(raw);
  history.replaceState({}, "", init ? "#result" : "#input");
  root.render(
    <App init={init} seed={seed} initialDate={date} initialUnlock={unlock} />,
  );
}
start().catch(() =>
  root.render(
    <button onClick={() => location.reload()}>
      저장 정보를 읽지 못했어. 다시 시도
    </button>,
  ),
);
