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
  function objectEq(obj1, obj2) {
    for (let [key, value] of Object.entries(obj1)) {
      if (obj2[key] !== value) {
        return false;
      }
    }
    return true;
  }
  let defaultPrefs = {};
  let initialPrefs = await browser.runtime.sendMessage({request: "getPrefs"});
  let currentPrefs = Object.assign({}, initialPrefs);
  let form = document.forms[0];
  let {elements} = form;
  let undo = document.getElementById("undo");
  let reset = document.getElementById("reset");
  async function savePrefs(newPrefs) {
    if (!newPrefs) {
      newPrefs = {};
      for (let pref of Object.keys(currentPrefs)) {
        let item = elements.namedItem(pref);
        if (item.nodeType && !item.validity.valid) {
          return;
        }
        newPrefs[pref] = getValue(item);
      }
    }
    Object.assign(currentPrefs, newPrefs);
    await browser.runtime.sendMessage({request: "setPrefs", data: newPrefs});
  }
  function setValues(storeOldAsDefault) {
    for (let [pref, value] of Object.entries(currentPrefs)) {
      let item = elements.namedItem(pref);
      if (item) {
        if (storeOldAsDefault) {
          defaultPrefs[pref] = getValue(item);
        }
        setValue(item, value);
      }
    }
    undo.disabled = true;
    reset.disabled = objectEq(currentPrefs, defaultPrefs);
  }
  setValues(true);
  form.addEventListener("input", function({target}) {
    if (target.validity.valid) {
      let value = getValue(target);
      let pref = target.name || target.id;
      if (value !== currentPrefs[pref]) {
        savePrefs({[pref]: value});
        undo.disabled = objectEq(currentPrefs, initialPrefs);
        reset.disabled = objectEq(currentPrefs, defaultPrefs);
      }
    }
  });
  undo.addEventListener("click", () => {
    savePrefs(initialPrefs);
    setValues(false);
  });
  form.addEventListener("reset", () => {
    requestAnimationFrame(() => {
      savePrefs();
      undo.disabled = objectEq(currentPrefs, initialPrefs);
      reset.disabled = true;
    });
  });
})();
