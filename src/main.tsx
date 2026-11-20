import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
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
import { loadFullScreenAd, showFullScreenAd } from "./ads";
import "./style.css";
function saved(): Profile | null {
  try {
    let p = JSON.parse(localStorage.wallet_profile);
    resolve(p);
    return p;
  } catch {
    return null;
  }
}
const init = saved(),
  browserKey =
    localStorage.wallet_key ||
    (localStorage.wallet_key = Array.from(
      crypto.getRandomValues(new Uint32Array(4)),
    ).join("-"));
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
function App() {
  const [key, setKey] = useState(browserKey);
  const [p, setP] = useState(init),
    [screen, S] = useState(init ? 1 : 0),
    [parts, setParts] = useState((init?.date || "--").split("-")),
    [lunar, L] = useState(init?.lunar || false),
    [leap, E] = useState(init?.leap || false),
    [hour, H] = useState(init?.hour ?? -1),
    [date, D] = useState(today()),
    [version, V] = useState(0),
    [status, A] = useState("loading"),
    [note, N] = useState("");
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
      () => (p ? fortune(p, date, key) : null),
      [p, date, key],
    ),
    stamp = "unlocked:" + date,
    opened = localStorage.getItem(stamp) === JSON.stringify(p);
  useEffect(() => {
    import("@apps-in-toss/web-framework")
      .then((s) => {
        if (s.User.getAnonymousKey.isSupported())
          s.User.getAnonymousKey()
            .then((v) => {
              if (v?.type === "HASH") setKey(v.hash);
            })
            .catch(() => {});
        try {
          for (const [edge, n] of Object.entries(s.getSafeAreaInsets()))
            document.documentElement.style.setProperty("--" + edge, n + "px");
        } catch {}
      })
      .catch(() => {});
    const timer = setInterval(() => D(today()), 15000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (screen !== 1 || opened) return;
    A("loading");
    return loadFullScreenAd({
      options: { adGroupId: "mock" },
      onEvent: () => A("ready"),
      onError: () => A("fallback"),
    });
  }, [screen === 1 || screen === 2, opened, date]);
  useEffect(() => {
    const back = () => {
      cancel.current?.();
      cancel.current = undefined;
      S(saved() ? 1 : 0);
      N("");
    };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, []);
  function go(n: number) {
    history.pushState({}, "", "#" + ["input", "result", "bonus"][n]);
    S(n);
    N("");
    scrollTo(0, 0);
  }
  function done(msg: string) {
    cancel.current = undefined;
    localStorage.setItem(stamp, JSON.stringify(p));
    V(version + 1);
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
      options: { adGroupId: "mock" },
      onEvent: (e) => {
        if (e.type === "dismissed") {
          A("ready");
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
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!complete || error) return;
                  const v = {
                    ...profile,
                    date: parts
                      .map((n, i) => (i ? n.padStart(2, "0") : n))
                      .join("-"),
                  };
                  localStorage.wallet_profile = JSON.stringify(v);
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
                <p>{result.comment}</p>
                <div className="metrics">
                  <div>
                    소비 방어력<b>{result.defense}%</b>
                  </div>
                  <div>
                    재물 기운<b>{"★".repeat(result.stars)}</b>
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
                ) : localStorage.getItem(stamp) ? (
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
                <div className="adslot"><small>Ad</small> 브라우저 테스트용 배너 광고</div>
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
                  모의 광고 3초를 끝까지 보면 전부 열려.
                  <br />
                  추가 광고와 결제는 없어.
                </p>
                <button
                  className="cta"
                  disabled={["loading", "playing"].includes(status)}
                  onClick={play}
                >
                  {
                    {
                      loading: "광고 준비 중…",
                      playing: "모의 광고 재생 중…",
                      fallback: "무료로 열기",
                      ready: "광고 보고 열기",
                    }[status]
                  }
                </button>
                <button
                  className="back"
                  onClick={() => {
                    cancel.current?.();
                    cancel.current = undefined;
                    history.back();
                  }}
                >
                  <ArrowLeft size={15} /> 나중에 할래
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
createRoot(document.getElementById("root")!).render(<App />);
