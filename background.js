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

let numTabs = new Map();
let lastTime = new Map();
let allWindows = undefined;
let events = {
  tabs: new Map(),
  windows: new Map(),
};

function svgDataIcon(text) {
  let serializer = new XMLSerializer();
  let doc = document.implementation.createDocument("http://www.w3.org/2000/svg", "svg", null);
  let root = doc.documentElement;
  root.setAttribute("width", "16");
  root.setAttribute("height", "16");
  let node = doc.createElementNS(root.namespaceURI, "text");
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
    let l = text.length;
    node.style.fontSize = `${14-l}px`;
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
  let last = lastTime.get(windowId);
  let notDelayed = num != -1;
  if (notDelayed && last == -1) {
    // There is a queued call.
    return;
  }
  let now = performance.now();
  let time = 250 - now + last;
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
  let text = num + "";
  let title = prefs.titlePrefix + text;
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

(async () => {
  prefs = await browser.storage.local.get(prefs);
  browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request === "getPrefs") {
      sendResponse(prefs);
    }
  });

  if (prefs.useBadge) {
    let bgColor = prefs.badgeBgColorEnabled ? prefs.badgeBgColor : "transparent";
    browser.browserAction.setBadgeBackgroundColor({color: bgColor});

    let color = prefs.badgeColorEnabled ? prefs.badgeColor : "transparent";
    browser.browserAction.setBadgeTextColor({color});
  } else if (!prefs.countAll) {
    // Set a transparent icon globally to prevent the default icon from flickering
    // when opening a new window.
    browser.browserAction.setIcon({imageData: new ImageData(1, 1)});
  }

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
    let windows = await browser.windows.getAll({populate: true});
    for (let {id, tabs: {length}} of windows) {
      update(id, length);
    }
  } else {
    let tabs = await browser.tabs.query({});
    update(allWindows, tabs.length);
  }
  for (let [api, listeners] of Object.entries(events)) {
    for (let [event, listener] of listeners) {
      browser[api][event].addListener(listener);
    }
  }
})();
