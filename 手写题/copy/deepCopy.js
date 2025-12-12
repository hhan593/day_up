function deepClone(target) {
  const constructor = target.constructor;
  if (/^(RegExp|Date)$/i.test(constructor.name)) {
    return new constructor(target);
  }

  if (isObject(target)) {
    const newObj = Array.isArray(target) ? [] : {};
    for (let key in target) {
      if (target.hasOwnProperty(key)) {
        newObj[key] = deepClone(target[key]);
      }
    }
    return newObj;
  }
}

function isObject(target) {
  return typeof target === "object" && target !== null;
}
