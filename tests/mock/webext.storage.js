class StorageArea {
  #storage = Object.create(null);

  // Firefox and Chrome are not interoperable regarding undefined values.
  // The following methods match Firefox 81.

  async get(keys) {
    const storage = this.#storage;
    if (keys == null) {
      return Object.assign({}, storage);
    }
    if (typeof keys === "string") {
      keys = {[keys]: undefined};
    } else if (Array.isArray(keys)) {
      keys = Object.fromEntries(keys.map((prop) => [prop, undefined]));
    }
    return Object.fromEntries(
      Object.entries(keys).map(([prop, fallback]) => {
        if (storage[prop] !== undefined) {
          return [prop, storage[prop]];
        }
        return [prop, fallback];
      }).filter(([/*prop*/, value]) => value !== undefined)
    );
  }

  async set(keys) {
    Object.assign(this.#storage, keys);
  }

  // Missing: `getBytesInUse`, `remove`, `clear`
}

const storage = {
  local: new StorageArea(),
  // managed: new StorageArea(), /* Requires some kind special manifest */
  // sync: new StorageArea(), /* So buggy in Firefox */
};

module.exports = storage;
