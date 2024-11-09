import { ref, watch } from "jsx";

const createLocalKey = (name: string) => `loclplyr__${name}`;
export const FILES_KEY = createLocalKey("files");

export function storedRef<T>(key: string, deserialize: (v: string | null) => T, serialize: (v: T) => string) {
  const localKey = createLocalKey(key);
  const ret = ref(deserialize(localStorage.getItem(localKey)));
  watch(() => localStorage.setItem(localKey, serialize(ret[0]())));
  return ret;
}
