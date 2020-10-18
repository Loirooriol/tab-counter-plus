//
// Copyright 2020 Oriol Brufau
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

class StorageArea {
  #storage = Object.create(null);

  // Firefox and Chrome are not interoperable regarding undefined values.
  // The following methods match Firefox 81.

  async get(keys) {
    const stor = this.#storage;
    if (keys == null) {
      return {...stor};
    }
    if (typeof keys === "string") {
      keys = {[keys]: undefined};
    } else if (Array.isArray(keys)) {
      keys = Object.fromEntries(keys.map((prop) => [prop, undefined]));
    }
    return Object.fromEntries(
      Object.entries(keys).map(([prop, fallback]) => {
        if (stor[prop] !== undefined) {
          return [prop, stor[prop]];
        }
        return [prop, fallback];
      }).filter(([/* prop */, value]) => value !== undefined)
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
