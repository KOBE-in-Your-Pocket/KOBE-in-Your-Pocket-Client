import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage の薄いラッパー。
 * 値の JSON シリアライズ / デシリアライズを吸収し、型付きの get/set/remove を提供する。
 */

/** 指定キーの値を読み出す。未保存・パース不能の場合は null を返す。 */
export async function getItem<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** 値を JSON 文字列として保存する。 */
export async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/** 指定キーの値を削除する。 */
export async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
