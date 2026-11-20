// SDK-shaped callbacks; ?ad=no-fill, ?ad=fail exercise the two fallback paths.
type Params<E> = {
  options: { adGroupId: string };
  onEvent: (event: { type: E }) => void;
  onError: (e: Error) => void;
};
const mode = () => new URLSearchParams(location.search).get("ad");
export function loadFullScreenAd(p: Params<"loaded">) {
  const timer = setTimeout(
    () =>
      mode() === "no-fill"
        ? p.onError(Error("no fill"))
        : p.onEvent({ type: "loaded" }),
    350,
  );
  return () => clearTimeout(timer);
}
export function showFullScreenAd(
  p: Params<"userEarnedReward" | "dismissed" | "failedToShow">,
) {
  let finished = false;
  function finish(type: "userEarnedReward" | "failedToShow" | "dismissed") {
    if (finished) return;
    finished = true;
    p.onEvent({ type });
  }
  const timer = setTimeout(
    () => finish(mode() === "fail" ? "failedToShow" : "userEarnedReward"),
    3000,
  );
  return () => {
    clearTimeout(timer);
    finish("dismissed");
  };
}
