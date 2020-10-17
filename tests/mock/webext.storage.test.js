async function check(s) {
  // Empty storage
  await expect(s.get()).resolves.toStrictEqual({});
  await expect(s.get('a')).resolves.toStrictEqual({});
  await expect(s.get(['a'])).resolves.toStrictEqual({});
  await expect(s.get(['a', 'b'])).resolves.toStrictEqual({});
  await expect(s.get({a: undefined})).resolves.toStrictEqual({});
  await expect(s.get({a: 1})).resolves.toStrictEqual({a: 1});
  await expect(s.get({a: 1, b: undefined})).resolves.toStrictEqual({a: 1});
  await expect(s.get({a: 1, b: 2})).resolves.toStrictEqual({a: 1, b:2});

  // Store an item
  await expect(s.set({a: 10})).resolves.toBe(undefined);
  await expect(s.get()).resolves.toStrictEqual({a: 10});
  await expect(s.get('a')).resolves.toStrictEqual({a: 10});
  await expect(s.get(['a'])).resolves.toStrictEqual({a: 10});
  await expect(s.get('b')).resolves.toStrictEqual({});
  await expect(s.get(['b'])).resolves.toStrictEqual({});
  await expect(s.get(['a', 'b'])).resolves.toStrictEqual({a: 10});
  await expect(s.get({a: undefined})).resolves.toStrictEqual({a: 10});
  await expect(s.get({b: undefined})).resolves.toStrictEqual({});
  await expect(s.get({a: 1})).resolves.toStrictEqual({a: 10});
  await expect(s.get({b: 1})).resolves.toStrictEqual({b: 1});
  await expect(s.get({a: undefined, b: undefined})).resolves.toStrictEqual({a: 10});
  await expect(s.get({a: 1, b: undefined})).resolves.toStrictEqual({a: 10});
  await expect(s.get({a: undefined, b: 2})).resolves.toStrictEqual({a: 10, b: 2});
  await expect(s.get({a: 1, b: 2})).resolves.toStrictEqual({a: 10, b: 2});

  // Update the previous item and store a new one
  await expect(s.set({a: 11, b: 22})).resolves.toBe(undefined);
  await expect(s.get()).resolves.toStrictEqual({a: 11, b: 22});
  await expect(s.get('a')).resolves.toStrictEqual({a: 11});
  await expect(s.get(['a'])).resolves.toStrictEqual({a: 11});
  await expect(s.get('b')).resolves.toStrictEqual({b: 22});
  await expect(s.get(['b'])).resolves.toStrictEqual({b: 22});
  await expect(s.get('c')).resolves.toStrictEqual({});
  await expect(s.get(['c'])).resolves.toStrictEqual({});
  await expect(s.get(['a', 'b'])).resolves.toStrictEqual({a: 11, b: 22});
  await expect(s.get(['a', 'c'])).resolves.toStrictEqual({a: 11});
  await expect(s.get(['b', 'c'])).resolves.toStrictEqual({b: 22});
  await expect(s.get(['a', 'b', 'c'])).resolves.toStrictEqual({a: 11, b: 22});
  await expect(s.get({a: undefined})).resolves.toStrictEqual({a: 11});
  await expect(s.get({b: undefined})).resolves.toStrictEqual({b: 22});
  await expect(s.get({c: undefined})).resolves.toStrictEqual({});
  await expect(s.get({a: 1})).resolves.toStrictEqual({a: 11});
  await expect(s.get({b: 2})).resolves.toStrictEqual({b: 22});
  await expect(s.get({c: 3})).resolves.toStrictEqual({c: 3});
  await expect(s.get({a: undefined, b: undefined})).resolves.toStrictEqual({a: 11, b: 22});
  await expect(s.get({a: 1, b: undefined})).resolves.toStrictEqual({a: 11, b: 22});
  await expect(s.get({a: undefined, b: 2})).resolves.toStrictEqual({a: 11, b: 22});
  await expect(s.get({a: 1, b: 2})).resolves.toStrictEqual({a: 11, b: 22});
  await expect(s.get({a: undefined, c: undefined})).resolves.toStrictEqual({a: 11});
  await expect(s.get({a: 1, c: undefined})).resolves.toStrictEqual({a: 11});
  await expect(s.get({a: undefined, c: 3})).resolves.toStrictEqual({a: 11, c: 3});
  await expect(s.get({a: 1, c: 3})).resolves.toStrictEqual({a: 11, c: 3});
  await expect(s.get({b: undefined, c: undefined})).resolves.toStrictEqual({b: 22});
  await expect(s.get({b: 2, c: undefined})).resolves.toStrictEqual({b: 22});
  await expect(s.get({b: undefined, c: 3})).resolves.toStrictEqual({b: 22, c: 3});
  await expect(s.get({b: 2, c: 3})).resolves.toStrictEqual({b: 22, c: 3});
  await expect(s.get({a: undefined, b: undefined, c: undefined})).resolves.toStrictEqual({a: 11, b: 22});
  await expect(s.get({a: 1, b: undefined, c: undefined})).resolves.toStrictEqual({a: 11, b: 22});
  await expect(s.get({a: undefined, b: 2, c: undefined})).resolves.toStrictEqual({a: 11, b: 22});
  await expect(s.get({a: 1, b: 2, c: undefined})).resolves.toStrictEqual({a: 11, b: 22});
  await expect(s.get({a: undefined, b: undefined, c: 3})).resolves.toStrictEqual({a: 11, b: 22, c: 3});
  await expect(s.get({a: 1, b: undefined, c: 3})).resolves.toStrictEqual({a: 11, b: 22, c: 3});
  await expect(s.get({a: undefined, b: 2, c: 3})).resolves.toStrictEqual({a: 11, b: 22, c: 3});
  await expect(s.get({a: 1, b: 2, c: 3})).resolves.toStrictEqual({a: 11, b: 22, c: 3});

  // Set an item to undefined
  await expect(s.set({b: undefined})).resolves.toBe(undefined);
  await expect(s.get()).resolves.toStrictEqual({a: 11, b: undefined});
  await expect(s.get('a')).resolves.toStrictEqual({a: 11});
  await expect(s.get(['a'])).resolves.toStrictEqual({a: 11});
  await expect(s.get('b')).resolves.toStrictEqual({});
  await expect(s.get(['b'])).resolves.toStrictEqual({});
  await expect(s.get('c')).resolves.toStrictEqual({});
  await expect(s.get(['c'])).resolves.toStrictEqual({});
  await expect(s.get(['a', 'b'])).resolves.toStrictEqual({a: 11});
  await expect(s.get(['a', 'c'])).resolves.toStrictEqual({a: 11});
  await expect(s.get(['b', 'c'])).resolves.toStrictEqual({});
  await expect(s.get(['a', 'b', 'c'])).resolves.toStrictEqual({a: 11});
  await expect(s.get({a: undefined})).resolves.toStrictEqual({a: 11});
  await expect(s.get({b: undefined})).resolves.toStrictEqual({});
  await expect(s.get({c: undefined})).resolves.toStrictEqual({});
  await expect(s.get({a: 1})).resolves.toStrictEqual({a: 11});
  await expect(s.get({b: 2})).resolves.toStrictEqual({b: 2});
  await expect(s.get({c: 3})).resolves.toStrictEqual({c: 3});
  await expect(s.get({a: undefined, b: undefined})).resolves.toStrictEqual({a: 11});
  await expect(s.get({a: 1, b: undefined})).resolves.toStrictEqual({a: 11});
  await expect(s.get({a: undefined, b: 2})).resolves.toStrictEqual({a: 11, b: 2});
  await expect(s.get({a: 1, b: 2})).resolves.toStrictEqual({a: 11, b: 2});
  await expect(s.get({a: undefined, c: undefined})).resolves.toStrictEqual({a: 11});
  await expect(s.get({a: 1, c: undefined})).resolves.toStrictEqual({a: 11});
  await expect(s.get({a: undefined, c: 3})).resolves.toStrictEqual({a: 11, c: 3});
  await expect(s.get({a: 1, c: 3})).resolves.toStrictEqual({a: 11, c: 3});
  await expect(s.get({b: undefined, c: undefined})).resolves.toStrictEqual({});
  await expect(s.get({b: 2, c: undefined})).resolves.toStrictEqual({b: 2});
  await expect(s.get({b: undefined, c: 3})).resolves.toStrictEqual({c: 3});
  await expect(s.get({b: 2, c: 3})).resolves.toStrictEqual({b: 2, c: 3});
  await expect(s.get({a: undefined, b: undefined, c: undefined})).resolves.toStrictEqual({a: 11});
  await expect(s.get({a: 1, b: undefined, c: undefined})).resolves.toStrictEqual({a: 11});
  await expect(s.get({a: undefined, b: 2, c: undefined})).resolves.toStrictEqual({a: 11, b: 2});
  await expect(s.get({a: 1, b: 2, c: undefined})).resolves.toStrictEqual({a: 11, b: 2});
  await expect(s.get({a: undefined, b: undefined, c: 3})).resolves.toStrictEqual({a: 11, c: 3});
  await expect(s.get({a: 1, b: undefined, c: 3})).resolves.toStrictEqual({a: 11, c: 3});
  await expect(s.get({a: undefined, b: 2, c: 3})).resolves.toStrictEqual({a: 11, b: 2, c: 3});
  await expect(s.get({a: 1, b: 2, c: 3})).resolves.toStrictEqual({a: 11, b: 2, c: 3});
}

const storage = require('./webext.storage.js');

test('storage.local', async () => {
  await check(storage.local);
});
