export function normalizeForSeed(value = "") {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export function hashText(value = "") {
  const normalized = normalizeForSeed(value);
  let hash = 2166136261;

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function variantSeed(seedText: string, variant = 0, salt = "") {
  return hashText(`${seedText}::${variant}::${salt}`);
}

export function seededIndex(seed: number, length: number, salt = "") {
  if (length <= 0) {
    return 0;
  }

  const saltValue = hashText(salt);
  return Math.abs(seed + saltValue) % length;
}

export function pickBySeed<T>(
  items: T[],
  seedText: string,
  variant = 0,
  salt = "",
) {
  if (!items.length) {
    return undefined;
  }

  const seed = variantSeed(seedText, variant, salt);
  return items[seededIndex(seed, items.length, salt)];
}

export function pickManyBySeed<T>(
  items: T[],
  count: number,
  seedText: string,
  variant = 0,
  salt = "",
) {
  const pool = [...items];
  const selected: T[] = [];

  for (let index = 0; index < count && pool.length; index += 1) {
    const seed = variantSeed(seedText, variant + index, `${salt}:${index}`);
    const pickedIndex = seededIndex(seed, pool.length, salt);
    const [picked] = pool.splice(pickedIndex, 1);

    selected.push(picked);
  }

  return selected;
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function uniqueByText(items: string[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const normalized = normalizeForSeed(item);

    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}
