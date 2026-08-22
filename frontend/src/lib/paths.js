export function getPath(object, path) {
  return path.split(".").reduce((value, key) => (value == null ? value : value[key]), object);
}

export function setPath(object, path, value) {
  const keys = path.split(".");
  const next = { ...object };
  let cursor = next;

  for (let index = 0; index < keys.length - 1; index += 1) {
    cursor[keys[index]] = { ...(cursor[keys[index]] || {}) };
    cursor = cursor[keys[index]];
  }

  cursor[keys[keys.length - 1]] = value;

  return next;
}

export function diffPaths(original, draft, paths) {
  const changes = {};
  let count = 0;

  for (const path of paths) {
    const before = getPath(original, path);
    const after = getPath(draft, path);

    if (JSON.stringify(before ?? "") !== JSON.stringify(after ?? "")) {
      Object.assign(changes, setPath(changes, path, after));
      count += 1;
    }
  }

  return { changes, count };
}
