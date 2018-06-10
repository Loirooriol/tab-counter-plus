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
  function getValue(input) {
    switch (input.type) {
      case "checkbox":
        return input.checked;
      case "number":
        return input.valueAsNumber;
      default:
        return input.value;
    }
  }
  function setValue(input, value) {
    switch (input.type) {
      case "checkbox":
        return input.checked = value;
      case "number":
        return input.valueAsNumber = value;
      default:
        return input.value = value;
    }
  }
  let prefs = await browser.runtime.sendMessage("getPrefs");
  async function savePrefs() {
    let newPrefs = {};
    for (let pref of Object.keys(prefs)) {
      let element = document.getElementById(pref);
      if (!element.validity.valid) {
        return;
      }
      newPrefs[pref] = getValue(element);
    }
    await browser.storage.local.set(newPrefs);
    Object.assign(prefs, newPrefs);
    browser.runtime.reload();
  }
  for (let [pref, value] of Object.entries(prefs)) {
    setValue(document.getElementById(pref), value);
  }
  document.querySelector("form").addEventListener("submit", function(event) {
    event.preventDefault();
    savePrefs();
  });
  document.querySelector("form").addEventListener("reset", function() {
    requestAnimationFrame(savePrefs);
  });
})();
