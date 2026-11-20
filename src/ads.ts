import {
  loadFullScreenAd as sdkLoad,
  showFullScreenAd as sdkShow,
} from "@apps-in-toss/web-framework";

type PlaybackEvent = "userEarnedReward" | "dismissed" | "failedToShow";
type Callbacks<E extends string> = {
  onEvent: (event: { type: E }) => void;
  onError: (error: Error) => void;
};
const options = {
  adGroupId:
    import.meta.env?.VITE_TOSS_AD_GROUP_ID?.trim() || "ait-ad-test-rewarded-id",
};
export function supportsNativeAds() {
  try {
    return sdkLoad.isSupported?.() === true;
  } catch {
    return false;
  }
}
const mockMode = () => new URLSearchParams(location.search).get("ad");

// SDK calls return an unsubscribe function. Deliver at most one terminal event,
// even if a bridge reports an error synchronously or dismisses after a reward.
function subscribeOnce<E extends string>(
  listen: (callbacks: Callbacks<E>) => () => void,
  callbacks: Callbacks<E>,
) {
  let active = true;
  let unsubscribe: (() => void) | undefined;
  function finish(deliver: () => void) {
    if (!active) return;
    active = false;
    queueMicrotask(() => {
      unsubscribe?.();
      deliver();
    });
  }
  try {
    unsubscribe = listen({
      onEvent: (event) => finish(() => callbacks.onEvent(event)),
      onError: (error) => finish(() => callbacks.onError(error)),
    });
  } catch (error) {
    finish(() =>
      callbacks.onError(error instanceof Error ? error : Error(String(error))),
    );
  }
  return () => {
    if (active) {
      active = false;
      unsubscribe?.();
    }
  };
}

export function loadFullScreenAd(callbacks: Callbacks<"loaded">) {
  if (supportsNativeAds()) {
    return subscribeOnce(
      (events) => sdkLoad({ options, ...events }),
      callbacks,
    );
  }
  const timer = setTimeout(() => {
    if (mockMode() === "no-fill") callbacks.onError(Error("no fill"));
    else callbacks.onEvent({ type: "loaded" });
  }, 350);
  return () => clearTimeout(timer);
}

export function showFullScreenAd(callbacks: Callbacks<PlaybackEvent>) {
  if (supportsNativeAds()) {
    return subscribeOnce(
      ({ onEvent, onError }) =>
        sdkShow({
          options,
          onError,
          onEvent: ({ type }) => {
            if (
              type === "userEarnedReward" ||
              type === "dismissed" ||
              type === "failedToShow"
            ) {
              onEvent({ type });
            }
          },
        }),
      callbacks,
    );
  }
  let finished = false;
  function finish(type: PlaybackEvent) {
    if (finished) return;
    finished = true;
    callbacks.onEvent({ type });
  }
  const timer = setTimeout(
    () => finish(mockMode() === "fail" ? "failedToShow" : "userEarnedReward"),
    3000,
  );
  return () => {
    clearTimeout(timer);
    finish("dismissed");
  };
}
