/*
 * Copyright 2018 Oriol Brufau
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(async function() {
  function getValue(item) {
    switch (item.type) {
      case "checkbox":
        return item.checked;
      case "number":
        return item.valueAsNumber;
      case "radio":
      case undefined: // RadioNodeList
        let {value} = item;
        try {
          let parsed = JSON.parse(value);
          if (Object(parsed) !== parsed) {
            return parsed;
          }
        } catch (error) {}
        return value;
      default:
        return item.value;
    }
  }
  function setValue(item, value) {
    switch (item.type) {
      case "checkbox":
        return item.checked = value;
      case "number":
        return item.valueAsNumber = value;
      default:
        return item.value = value;
    }
  }
  let prefs = await browser.runtime.sendMessage({request: "getPrefs"});
  let form = document.forms[0];
  let {elements} = form;
  async function savePrefs(newPrefs) {
    if (!newPrefs) {
      newPrefs = {};
      for (let pref of Object.keys(prefs)) {
        let item = elements.namedItem(pref);
        if (item.nodeType && !item.validity.valid) {
          return;
        }
        let value = getValue(item);
        if (value !== prefs[pref]) {
          newPrefs[pref] = value;
        }
      }
    }
    Object.assign(prefs, newPrefs);
    await browser.runtime.sendMessage({request: "setPrefs", data: newPrefs});
  }
  function setValues() {
    for (let [pref, value] of Object.entries(prefs)) {
      let item = elements.namedItem(pref);
      if (item) {
        setValue(item, value);
      }
    }
  }
  setValues();
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    savePrefs();
  });
  form.addEventListener("reset", () => {
    requestAnimationFrame(savePrefs);
  });
})();
