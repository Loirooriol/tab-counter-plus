async function check(s) {
  function checkGet(arg, expected) {
    return expect(s.get(arg)).resolves.toStrictEqual(expected);
  }

  // Empty storage
  await checkGet(undefined, {});
  await checkGet('a', {});
  await checkGet(['a'], {});
  await checkGet(['a', 'b'], {});
  await checkGet({a: undefined}, {});
  await checkGet({a: 1}, {a: 1});
  await checkGet({a: 1, b: undefined}, {a: 1});
  await checkGet({a: 1, b: 2}, {a: 1, b:2});

  // Store an item
  await expect(s.set({a: 10})).resolves.toBe(undefined);
  await checkGet(undefined, {a: 10});
  await checkGet('a', {a: 10});
  await checkGet(['a'], {a: 10});
  await checkGet('b', {});
  await checkGet(['b'], {});
  await checkGet(['a', 'b'], {a: 10});
  await checkGet({a: undefined}, {a: 10});
  await checkGet({b: undefined}, {});
  await checkGet({a: 1}, {a: 10});
  await checkGet({b: 1}, {b: 1});
  await checkGet({a: undefined, b: undefined}, {a: 10});
  await checkGet({a: 1, b: undefined}, {a: 10});
  await checkGet({a: undefined, b: 2}, {a: 10, b: 2});
  await checkGet({a: 1, b: 2}, {a: 10, b: 2});

  // Update the previous item and store a new one
  await expect(s.set({a: 11, b: 22})).resolves.toBe(undefined);
  await checkGet(undefined, {a: 11, b: 22});
  await checkGet('a', {a: 11});
  await checkGet(['a'], {a: 11});
  await checkGet('b', {b: 22});
  await checkGet(['b'], {b: 22});
  await checkGet('c', {});
  await checkGet(['c'], {});
  await checkGet(['a', 'b'], {a: 11, b: 22});
  await checkGet(['a', 'c'], {a: 11});
  await checkGet(['b', 'c'], {b: 22});
  await checkGet(['a', 'b', 'c'], {a: 11, b: 22});
  await checkGet({a: undefined}, {a: 11});
  await checkGet({b: undefined}, {b: 22});
  await checkGet({c: undefined}, {});
  await checkGet({a: 1}, {a: 11});
  await checkGet({b: 2}, {b: 22});
  await checkGet({c: 3}, {c: 3});
  await checkGet({a: undefined, b: undefined}, {a: 11, b: 22});
  await checkGet({a: 1, b: undefined}, {a: 11, b: 22});
  await checkGet({a: undefined, b: 2}, {a: 11, b: 22});
  await checkGet({a: 1, b: 2}, {a: 11, b: 22});
  await checkGet({a: undefined, c: undefined}, {a: 11});
  await checkGet({a: 1, c: undefined}, {a: 11});
  await checkGet({a: undefined, c: 3}, {a: 11, c: 3});
  await checkGet({a: 1, c: 3}, {a: 11, c: 3});
  await checkGet({b: undefined, c: undefined}, {b: 22});
  await checkGet({b: 2, c: undefined}, {b: 22});
  await checkGet({b: undefined, c: 3}, {b: 22, c: 3});
  await checkGet({b: 2, c: 3}, {b: 22, c: 3});
  await checkGet({a: undefined, b: undefined, c: undefined}, {a: 11, b: 22});
  await checkGet({a: 1, b: undefined, c: undefined}, {a: 11, b: 22});
  await checkGet({a: undefined, b: 2, c: undefined}, {a: 11, b: 22});
  await checkGet({a: 1, b: 2, c: undefined}, {a: 11, b: 22});
  await checkGet({a: undefined, b: undefined, c: 3}, {a: 11, b: 22, c: 3});
  await checkGet({a: 1, b: undefined, c: 3}, {a: 11, b: 22, c: 3});
  await checkGet({a: undefined, b: 2, c: 3}, {a: 11, b: 22, c: 3});
  await checkGet({a: 1, b: 2, c: 3}, {a: 11, b: 22, c: 3});

  // Set an item to undefined
  await expect(s.set({b: undefined})).resolves.toBe(undefined);
  await checkGet(undefined, {a: 11, b: undefined});
  await checkGet('a', {a: 11});
  await checkGet(['a'], {a: 11});
  await checkGet('b', {});
  await checkGet(['b'], {});
  await checkGet('c', {});
  await checkGet(['c'], {});
  await checkGet(['a', 'b'], {a: 11});
  await checkGet(['a', 'c'], {a: 11});
  await checkGet(['b', 'c'], {});
  await checkGet(['a', 'b', 'c'], {a: 11});
  await checkGet({a: undefined}, {a: 11});
  await checkGet({b: undefined}, {});
  await checkGet({c: undefined}, {});
  await checkGet({a: 1}, {a: 11});
  await checkGet({b: 2}, {b: 2});
  await checkGet({c: 3}, {c: 3});
  await checkGet({a: undefined, b: undefined}, {a: 11});
  await checkGet({a: 1, b: undefined}, {a: 11});
  await checkGet({a: undefined, b: 2}, {a: 11, b: 2});
  await checkGet({a: 1, b: 2}, {a: 11, b: 2});
  await checkGet({a: undefined, c: undefined}, {a: 11});
  await checkGet({a: 1, c: undefined}, {a: 11});
  await checkGet({a: undefined, c: 3}, {a: 11, c: 3});
  await checkGet({a: 1, c: 3}, {a: 11, c: 3});
  await checkGet({b: undefined, c: undefined}, {});
  await checkGet({b: 2, c: undefined}, {b: 2});
  await checkGet({b: undefined, c: 3}, {c: 3});
  await checkGet({b: 2, c: 3}, {b: 2, c: 3});
  await checkGet({a: undefined, b: undefined, c: undefined}, {a: 11});
  await checkGet({a: 1, b: undefined, c: undefined}, {a: 11});
  await checkGet({a: undefined, b: 2, c: undefined}, {a: 11, b: 2});
  await checkGet({a: 1, b: 2, c: undefined}, {a: 11, b: 2});
  await checkGet({a: undefined, b: undefined, c: 3}, {a: 11, c: 3});
  await checkGet({a: 1, b: undefined, c: 3}, {a: 11, c: 3});
  await checkGet({a: undefined, b: 2, c: 3}, {a: 11, b: 2, c: 3});
  await checkGet({a: 1, b: 2, c: 3}, {a: 11, b: 2, c: 3});
}

const storage = require('./webext.storage.js');

test('storage.local', async () => {
  await check(storage.local);
});
