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
  const timer = setTimeout(
    () =>
      p.onEvent({
        type: mode() === "fail" ? "failedToShow" : "userEarnedReward",
      }),
    3000,
  );
  return () => {
    clearTimeout(timer);
    p.onEvent({ type: "dismissed" });
  };
}
