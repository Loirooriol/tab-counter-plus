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
      case undefined: { // RadioNodeList
        const {value} = item;
        // Try to parse the value in case it's a literal (e.g. "true" -> true).
        let parsed;
        try {
          parsed = JSON.parse(value);
        } catch (error) {
          return value;
        }
        // If this produced a primitive (not an object), return the primitive.
        if (Object(parsed) !== parsed) {
          return parsed;
        }
        return value;
      }
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
    for (const [key, value] of Object.entries(obj1)) {
      if (obj2[key] !== value) {
        return false;
      }
    }
    return true;
  }
  const defaultPrefs = {};
  const initialPrefs = await browser.runtime.sendMessage({request: "getPrefs"});
  const currentPrefs = Object.assign({}, initialPrefs);
  const form = document.forms[0];
  const {elements} = form;
  const undo = document.getElementById("undo");
  const reset = document.getElementById("reset");
  async function savePrefs(newPrefs) {
    if (!newPrefs) {
      newPrefs = {};
      for (const pref of Object.keys(currentPrefs)) {
        const item = elements.namedItem(pref);
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
    for (const [pref, value] of Object.entries(currentPrefs)) {
      const item = elements.namedItem(pref);
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
  form.addEventListener("input", ({target}) => {
    if (target.validity.valid) {
      const value = getValue(target);
      const pref = target.name || target.id;
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
