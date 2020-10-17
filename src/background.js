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
  bgColor: "#ffffff",
  bgColorEnabled: false,
  badgeBgColor: "#4b4b4b",
  badgeBgColorEnabled: true,
  color: "#000000",
  colorEnabled: true,
  badgeColor: "#ffffff",
  badgeColorEnabled: true,
  titlePrefix: "Open tabs: ",
};

const numTabs = new Map();
const lastTime = new Map();
const allWindows = undefined;
const events = {
  tabs: new Map(),
  windows: new Map(),
};

let svgDataIcon;
function svgDataIcon_(text) {
  const serializer = new XMLSerializer();
  const doc = document.implementation.createDocument(
    "http://www.w3.org/2000/svg", "svg", null);
  const root = doc.documentElement;
  root.setAttribute("width", "16");
  root.setAttribute("height", "16");
  const node = doc.createElementNS(root.namespaceURI, "text");
  node.setAttribute("x", "50%");
  node.setAttribute("y", "50%");
  Object.assign(node.style, {
    dominantBaseline: "central",
    textAnchor: "middle",
    fontFamily: "'Segoe UI', 'DejaVu Sans', sans-serif",
    fill: prefs.colorEnabled ? prefs.color : "transparent",
  });
  root.style.backgroundColor = prefs.bgColorEnabled ? prefs.bgColor : "transparent";
  root.appendChild(node);
  svgDataIcon = function(text) {
    const l = text.length;
    node.style.fontSize = `${14 - l}px`;
    if (l > 2) {
      node.setAttribute("textLength", "100%");
      node.setAttribute("lengthAdjust", "spacingAndGlyphs");
    } else {
      node.removeAttribute("textLength");
      node.removeAttribute("lengthAdjust");
    }
    node.textContent = text;
    return "data:image/svg+xml," + encodeURIComponent(serializer.serializeToString(doc));
  };
  return svgDataIcon(text);
}

function show(windowId, num = -1) {
  // Debounce if there are multiple calls in a short amount of time.
  const last = lastTime.get(windowId);
  const notDelayed = num !== -1;
  if (notDelayed && last === -1) {
    // There is a queued call.
    return;
  }
  const now = performance.now();
  const time = 250 - now + last;
  if (notDelayed && time > 0) {
    setTimeout(show, time, windowId);
    lastTime.set(windowId, -1);
    return;
  }
  lastTime.set(windowId, now);
  if (!notDelayed) {
    num = numTabs.get(windowId);
  }

  // Show the counter
  const text = num + "";
  const title = prefs.titlePrefix + text;
  browser.browserAction.setTitle({ title, windowId });
  if (prefs.useBadge) {
    browser.browserAction.setBadgeText({ text, windowId });
  } else {
    browser.browserAction.setIcon({ path: svgDataIcon(text), windowId });
  }
}

function update(windowId, num) {
  numTabs.set(windowId, num);
  show(windowId, num);
}

function increase(windowId, increment) {
  if (prefs.countAll) {
    windowId = allWindows;
  }
  let num = numTabs.get(windowId) || 0;
  num += increment;
  update(windowId, num);
}

function initCounters() {
  if (prefs.useBadge) {
    const bgColor = prefs.badgeBgColorEnabled ? prefs.badgeBgColor : "transparent";
    browser.browserAction.setBadgeBackgroundColor({color: bgColor});

    const color = prefs.badgeColorEnabled ? prefs.badgeColor : "transparent";
    browser.browserAction.setBadgeTextColor({color});
  } else {
    svgDataIcon = svgDataIcon_;
    if (!prefs.countAll) {
      // Set a transparent icon globally to prevent the default icon from flickering
      // when opening a new window.
      browser.browserAction.setIcon({imageData: new ImageData(1, 1)});
    }
  }
}

function clearCounters() {
  for (const windowId of numTabs.keys()) {
    browser.browserAction.setTitle({title: null, windowId});
    browser.browserAction.setBadgeText({text: null, windowId});
    browser.browserAction.setIcon({path: null, windowId});
  }
  browser.browserAction.setIcon({imageData: null});
}

async function startup() {
  initCounters();

  events.tabs.set("onCreated", ({windowId}) => {
    increase(windowId, +1);
  });
  events.tabs.set("onRemoved", (tabId, {windowId, isWindowClosing}) => {
    if (!isWindowClosing || prefs.countAll) {
      increase(windowId, -1);
    }
  });
  if (!prefs.countAll) {
    events.tabs.set("onAttached", (tabId, {newWindowId}) => {
      increase(newWindowId, +1);
    });
    events.tabs.set("onDetached", (tabId, {oldWindowId}) => {
      increase(oldWindowId, -1);
    });
    events.windows.set("onRemoved", (windowId) => {
      numTabs.delete(windowId);
      lastTime.delete(windowId);
    });
    const windows = await browser.windows.getAll({populate: true});
    for (const {id, tabs: {length}} of windows) {
      update(id, length);
    }
  } else {
    const tabs = await browser.tabs.query({});
    update(allWindows, tabs.length);
  }
  for (const [api, listeners] of Object.entries(events)) {
    for (const [event, listener] of listeners) {
      browser[api][event].addListener(listener);
    }
  }
}

function shutdown() {
  // Remove counter styles, this must happen before clearing `numTabs`.
  clearCounters();

  // Clear data
  numTabs.clear();
  lastTime.clear();

  // Remove event listeners
  for (const [api, listeners] of Object.entries(events)) {
    for (const [event, listener] of listeners) {
      browser[api][event].removeListener(listener);
    }
    listeners.clear();
  }
}

(async () => {
  prefs = await browser.storage.local.get(prefs);
  browser.runtime.onMessage.addListener(async (request) => {
    switch (request.request) {
      case "getPrefs": {
        return prefs;
      }
      case "setPrefs": {
        const newPrefs = request.data;
        Object.assign(prefs, newPrefs);
        await browser.storage.local.set(newPrefs);

        if ("countAll" in newPrefs) {
          // Need to destroy all data and start from scratch
          shutdown();
          await startup();
          return;
        }

        // Only clear counters when changing the counter type, this avoids flickering
        // in other cases.
        if ("useBadge" in newPrefs) {
          clearCounters();
        }
        initCounters();

        // Rerender current counters
        for (const [windowId, num] of numTabs) {
          show(windowId, num);
        }
        return;
      }
      default: {
        throw new Error("Invalid request: " + request.request);
      }
    }
  });
  await startup();
})();
