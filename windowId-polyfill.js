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

async function windowIdPolyfill(params, windowIdWillAlwaysBeUndefined) {
  let originalMethod = Object.create(null);
  let activeTab = Symbol();
  let windowData = new Map();
  let {browserAction} = browser;

  for (let [key, method] of Object.entries(params)) {
    originalMethod[key] = browserAction[method];
    browserAction[method] = function({windowId, ...details}) {
      if (windowIdWillAlwaysBeUndefined || windowId == null) {
        return Reflect.apply(originalMethod[key], browserAction, [details]);
      }
      let data = windowData.get(windowId);
      if (!data) {
        data = Object.create(null);
        data[activeTab] = null;
        windowData.set(windowId, data);
      }
      data[key] = details[key];
      update(windowId, data, [key]);
    };
  }

  if (windowIdWillAlwaysBeUndefined) {
    // Avoid adding the event listeners if they are unnecessary.
    return;
  }

  function handleError(error) {
    if (error.message.includes("Invalid tab ID")) {
      // The tab has been removed
    } else {
      throw error;
    }
  }

  function setData(data, tabId = undefined, keys = Object.keys(data)) {
    for (let key of keys) {
      let details = {tabId, [key]: data[key]};
      Reflect.apply(originalMethod[key], browserAction, [details]).catch(handleError);
    }
  }

  function clearData(data, tabId = undefined, keys = Object.keys(data)) {
    try {
      for (let key of keys) {
        let details = {tabId, [key]: null};
        Reflect.apply(originalMethod[key], browserAction, [details]).catch(handleError);
      }
    } catch (error) {
      // Tab-specific browserAction cannot be cleared before Firefox 59.
    }
  }

  async function update(windowId, data, keys) {
    // Get active tab if necessary.
    if (data[activeTab] == null) {
      let [tab] = await browser.tabs.query({active: true, windowId});
      if (!tab) {
        // The window does not exist
        windowData.delete(windowId);
        return;
      }
      data[activeTab] = tab.id;
    }

    // Set tab-specific data in the active tab.
    setData(data, data[activeTab], keys);

   let {focused} = await browser.windows.get(windowId);
   if (focused) {
     // Set global data to avoid flickering when active tab changes.
     setData(data, undefined, keys);
   }
  }

  for (let {windowId, id} of await browser.tabs.query({active: true})) {
    let data = Object.create(null);
    data[activeTab] = id;
    windowData.set(windowId, data);
  }
  browser.windows.onCreated.addListener(function ({id: windowId}) {
    if (!windowData.has(windowId)) {
      let data = Object.create(null);
      data[activeTab] = null;
      windowData.set(windowId, data);
    }
  });
  browser.windows.onRemoved.addListener(function (windowId) {
    let data = windowData.get(windowId);
    if (!data) {
      return;
    }
    windowData.delete(windowId);

    // If the last tab was moved into another window while we still thought
    // it was the active tab of the window being removed, then it needs to
    // be updated.
    let active = data[activeTab];
    if (active != null) {
      browser.tabs.get(active).then(function(tab) {
        if (tab.active && tab.windowId != windowId) {
          let {windowId, id} = tab;
          let data = windowData.get(windowId);
          data[activeTab] = id;
          update(windowId, data);
        }
      }, handleError);
    }
  });
  browser.windows.onFocusChanged.addListener(async function (windowId) {
    // The focus can go to a non-browser window like a console.
    if (windowData.has(windowId)) {
      // Update global values when focused window changes.
      let data = windowData.get(windowId);
      setData(data, undefined);
    }
  });
  browser.tabs.onActivated.addListener(function ({windowId, tabId}) {
    // Clear the data of the previously active tab.
    let data = windowData.get(windowId);
    let active = data[activeTab];
    if (active != null) {
      clearData(data, active);
    }

    // Set the data to the current active tab.
    data[activeTab] = tabId;
    setData(data, tabId);
  });
  browser.tabs.onUpdated.addListener(function (tabId, {status}, {active, windowId}) {
    if (status && active) {
      // An active tab navigated to a new page and its tab-specific
      // browserAction was cleared. It needs to be restored.
      let data = windowData.get(windowId);
      setData(data, tabId);
    }
  });
}