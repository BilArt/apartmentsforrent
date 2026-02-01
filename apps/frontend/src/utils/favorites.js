const KEY = "favorites:listings:v1";

export function getFavoriteIds() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

export function getFavoriteSet() {
  return new Set(getFavoriteIds());
}

export function isFavorite(id) {
  const set = getFavoriteSet();
  return set.has(String(id));
}

export function setFavorite(id, value) {
  const set = getFavoriteSet();
  const key = String(id);

  if (value) set.add(key);
  else set.delete(key);

  localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
  return set;
}

export function toggleFavorite(id) {
  const set = getFavoriteSet();
  const key = String(id);

  if (set.has(key)) set.delete(key);
  else set.add(key);

  localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
  return set;
}
