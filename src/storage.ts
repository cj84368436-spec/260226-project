import {
  Storage,
  getOperationalEnvironment,
  User,
} from "@apps-in-toss/web-framework";

function inHost() {
  try {
    return ["toss", "sandbox"].includes(getOperationalEnvironment());
  } catch {
    return false;
  }
}
const native = inHost();
export const store = {
  async read(key: string) {
    if (native) {
      const stored = await Storage.getItem(key);
      if (stored !== null) return stored;
      const legacy = localStorage.getItem(key);
      if (legacy !== null) await Storage.setItem(key, legacy);
      return legacy;
    }
    return localStorage.getItem(key);
  },
  async write(key: string, value: string) {
    if (native) await Storage.setItem(key, value);
    else localStorage.setItem(key, value);
  },
};
export async function seedKey() {
  const stored = await store.read("wallet_key");
  if (stored) return stored;
  let seed = Array.from(crypto.getRandomValues(new Uint32Array(4))).join("-");
  if (native && User.getAnonymousKey.isSupported()) {
    try {
      const v = await Promise.race([
        User.getAnonymousKey(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)),
      ]);
      if (v?.type === "HASH") seed = v.hash;
    } catch {
      /* First launch can also be offline. */
    }
  }
  await store.write("wallet_key", seed);
  return seed;
}
