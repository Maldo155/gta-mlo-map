const STORAGE_KEY = "mlomesh_visited_mlos";

export function getVisitedMloIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function addVisitedMloId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const ids = getVisitedMloIds();
    ids.add(id);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}
