import assert from "node:assert/strict";
import { mock, test } from "node:test";

let loadParams, showParams, cleanups;
const sdkLoad = Object.assign(
  (params) => {
    loadParams = params;
    return () => {
      cleanups++;
    };
  },
  { isSupported: () => true },
);
const sdkShow = (params) => {
  showParams = params;
  return () => {
    cleanups++;
  };
};
mock.module("@apps-in-toss/web-framework", {
  exports: { loadFullScreenAd: sdkLoad, showFullScreenAd: sdkShow },
});
const ads = await import("../src/ads.ts");
const flush = () => new Promise((resolve) => queueMicrotask(resolve));

test("SDK 보상형 광고는 동일한 테스트 ID로 로드하고 보상 이벤트를 한 번만 처리한다", async () => {
  cleanups = 0;
  const received = [];
  const callbacks = {
    onEvent: (e) => received.push(e.type),
    onError: assert.fail,
  };
  assert.equal(ads.supportsNativeAds(), true);
  ads.loadFullScreenAd(callbacks);
  assert.equal(loadParams.options.adGroupId, "ait-ad-test-rewarded-id");
  loadParams.onEvent({ type: "loaded" });
  await flush();
  ads.showFullScreenAd(callbacks);
  assert.deepEqual(showParams.options, loadParams.options);
  for (const type of ["requested", "show", "impression", "clicked"])
    showParams.onEvent({ type });
  assert.deepEqual(received, ["loaded"]);
  showParams.onEvent({ type: "userEarnedReward" });
  showParams.onEvent({ type: "dismissed" });
  showParams.onError(Error("late error"));
  await flush();
  assert.deepEqual(received, ["loaded", "userEarnedReward"]);
  assert.equal(cleanups, 2);
});

test("SDK 중도 닫기 및 재생 실패를 구분하고 취소한 로드의 이벤트는 무시한다", async () => {
  const received = [];
  const callbacks = {
    onEvent: (e) => received.push(e.type),
    onError: (e) => received.push(e.message),
  };
  const stop = ads.loadFullScreenAd(callbacks);
  stop();
  loadParams.onEvent({ type: "loaded" });
  for (const type of ["dismissed", "failedToShow"]) {
    ads.showFullScreenAd(callbacks);
    showParams.onEvent({ type });
    await flush();
  }
  ads.loadFullScreenAd(callbacks);
  loadParams.onError(Error("no fill"));
  await flush();
  assert.deepEqual(received, ["dismissed", "failedToShow", "no fill"]);
});
