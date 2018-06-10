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

let prefs = {
  countAll: false,
  useBadge: false,
  debug: false,
  bgColor: "#ffffff",
  bgColorEnabled: false,
  badgeBgColor: "#4b4b4b",
  badgeBgColorEnabled: true,
  color: "#000000",
  colorEnabled: true,
  titlePrefix: "Open tabs: ",
};

let hash = Object.create(null);
let imageData;
const allWindows = Symbol();

function parseColor(color, enabled) {
  return enabled ? color.replace(/[^#\w]/g, "") : "transparent";
}
function setCounter(text, tabId) {
  let title = prefs.titlePrefix + text;
  if (prefs.useBadge) {
    browser.browserAction.setBadgeText({ text, tabId });
    browser.browserAction.setTitle({ title, tabId });
  } else {
    let l = text.length;
    let path = "data:image/svg+xml," + encodeURIComponent(`<?xml version="1.0" encoding="utf-8"?>
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <style type="text/css"><![CDATA[
      text {
        dominant-baseline: central;
        font-family: 'Segoe UI', 'DejaVu Sans', sans-serif;
        font-size: ${14-l}px;
        text-anchor: middle;
        fill: ${parseColor(prefs.color, prefs.colorEnabled)};
      }
      svg {
        background-color: ${parseColor(prefs.bgColor, prefs.bgColorEnabled)};
      }
      ]]></style>
      <text x="50%" y="50%"
        ${l > 2 ? 'textLength="100%"' : ''}
        ${l > 2 ? 'lengthAdjust="spacingAndGlyphs"' : ''}
      >${text}</text>
    </svg>`);
    browser.browserAction.setIcon({ path, tabId });
    browser.browserAction.setTitle({ title, tabId });
  }
}

function clearCounter(tabId) {
  if (prefs.useBadge) {
    browser.browserAction.setBadgeText({ text: null, tabId });
  } else {
    browser.browserAction.setIcon({ imageData: null, tabId });
  }
}

async function activeTab(windowId) {
  let tabs = await browser.tabs.query({active: true, windowId});
  return tabs[0];
}

function getData(windowId) {
  if (prefs.countAll) {
    windowId = allWindows;
  }
  let data = hash[windowId];
  if (!data) {
    data = Object.create(null);
    data.count = 0;
    hash[windowId] = data;
  }
  return data;
}

const update = async function (windowId, cause, data = getData(windowId)) {
  // Debounce calls.
  if (cause !== "delayed" && data.lastTime == -1) {
    // There is a queued call.
    if (prefs.debug) console.log(cause, windowId, "avoided");
    return;
  }
  let now = performance.now();
  let time = 250 - now + data.lastTime;
  if (cause !== "delayed" && time > 0) {
    setTimeout(update, time, windowId, "delayed");
    data.lastTime = -1;
    return;
  }
  data.lastTime = now;

  if (prefs.debug) console.log(cause, windowId, {...data});

  if (prefs.countAll) {
    let text = data.count + "";
    setCounter(text);
    return;
  }

  // Get active tab
  if (data.active == null) {
    let tab = await activeTab(windowId);
    if (!tab) {
      // Can happen when focusing a window with no tabs, e.g. the browser console.
      return;
    }
    data.active = tab.id;
  }

  let text = data.count + "";

  // Update the active tab
  setCounter(text, data.active);

  // Set as the new default
  let {focused} = await browser.windows.get(windowId);
  if (focused) {
    setCounter(text);
  }
};

(async () => {
  prefs = await browser.storage.local.get(prefs);
  browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request === "getPrefs") {
      sendResponse(prefs);
    }
  });

  if (prefs.useBadge) {
    let color = prefs.badgeBgColorEnabled ? prefs.badgeBgColor : "transparent";
    browser.browserAction.setBadgeBackgroundColor({color});
  }

  browser.tabs.onCreated.addListener(function ({windowId}) {
    // Creating a tab increases the counter.
    let data = getData(windowId);
    data.count += 1;
    update(windowId, "onCreated", data);
  });
  browser.tabs.onRemoved.addListener(function (tabId, {windowId, isWindowClosing}) {
    // Removing a tab decreases the counter.
    if (!prefs.countAll && isWindowClosing) {
      delete hash[windowId];
      return;
    }
    let data = getData(windowId);
    if (!prefs.countAll && data.active === tabId) {
      data.active = null;
    }
    data.count -= 1;
    // If multiple tabs are removed, this one could not be the active one but another might.
    // Therefore don't synchronously update, wait a bit so that the active tab can be unset.
    setTimeout(update, 0, windowId, "onRemoved", data);
  });
  if (!prefs.countAll) {
    browser.windows.onFocusChanged.addListener(function (windowId) {
      // Update the default when focused window changes.
      update(windowId, "onFocusChanged");
    });
    browser.tabs.onActivated.addListener(function ({windowId, tabId}) {
      // An activated tab could have an old counter, update it.
      let data = getData(windowId);
      if (data.active != null) {
        try {
          clearCounter(data.active);
        } catch (err) {
          // Tab-specific browserAction cannot be cleared before Firefox 59.
        }
      }
      data.active = tabId;
      update(windowId, "onActivated", data);
    });
    browser.tabs.onUpdated.addListener(function (tabId, {status}, {active, windowId}) {
      if (status && active) {
        // An active tab navigated to a new page and its tab-specific
        // browserAction was cleared. It needs to be restored.
        update(windowId, "onUpdated");
      }
    });
    browser.tabs.onAttached.addListener(function (tabId, {newWindowId}) {
      let data = getData(newWindowId);
      data.count += 1;
      update(newWindowId, "onAttached", data);
    });
    browser.tabs.onDetached.addListener(function (tabId, {oldWindowId}) {
      let data = getData(oldWindowId);
      data.count -= 1;
      update(oldWindowId, "onDetached", data);
    });
    for (let {windowId, id} of await browser.tabs.query({active: true})) {
      let tabs = await browser.tabs.query({ windowId });
      let data = getData(windowId);
      data.count = tabs.length;
      data.active = id;
      update(windowId, "initial", data);
    }
  } else {
    let tabs = await browser.tabs.query({});
    let data = getData(allWindows);
    data.count = tabs.length;
    update(allWindows, "initial", data);
  }
})();
