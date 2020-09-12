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
      case undefined:
        // RadioNodeList
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
  let prefs = await browser.runtime.sendMessage("getPrefs");
  async function savePrefs() {
    let newPrefs = {};
    for (let pref of Object.keys(prefs)) {
      let item = elements.namedItem(pref);
      if (item.nodeType && !item.validity.valid) {
        return;
      }
      newPrefs[pref] = getValue(item);
    }
    await browser.storage.local.set(newPrefs);
    Object.assign(prefs, newPrefs);
    browser.runtime.reload();
  }
  let {elements} = document.forms[0];
  for (let [pref, value] of Object.entries(prefs)) {
    let item = elements.namedItem(pref);
    if (item) {
      setValue(item, value);
    }
  }
  document.querySelector("form").addEventListener("submit", function(event) {
    event.preventDefault();
    savePrefs();
  });
  document.querySelector("form").addEventListener("reset", function() {
    requestAnimationFrame(savePrefs);
  });
  if (browser.browserAction.setBadgeTextColor) {
    document.body.classList.add("badge-color-api");
  }
})();
