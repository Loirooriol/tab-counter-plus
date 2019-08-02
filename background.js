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

function svgDataIcon(text, prefs) {
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
    browser.browserAction.setIcon({ path: { 16: "icon16.gif", 64: "icon.svg" }, windowId });
    browser.browserAction.setBadgeText({ text, windowId });
  } else {
    browser.browserAction.setIcon({ path: svgDataIcon(text, prefs), windowId });
    browser.browserAction.setBadgeText({ text: null, windowId });
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

function tabOnCreatedListener ({windowId}) {
  increase(windowId, +1);
}
function tabOnRemovedListener(tabId, {windowId, isWindowClosing}) {
  if (!isWindowClosing || prefs.countAll) {
    increase(windowId, -1);
  }
}

function tabOnAttachedListener(tabId, {newWindowId}) {
  increase(newWindowId, +1);
}
function tabOnDetachedListener(tabId, {oldWindowId}) {
  increase(oldWindowId, -1);
}

function windowOnRemovedListener(windowId) {
  numTabs.delete(windowId);
  lastTime.delete(windowId);
}

async function init() {
  prefs = await browser.storage.local.get(prefs);

  if (prefs.useBadge) {
    let bgColor = prefs.badgeBgColorEnabled ? prefs.badgeBgColor : "transparent";
    browser.browserAction.setBadgeBackgroundColor({color: bgColor});

    // Badge text color was added in Firefox 63
    if (browser.browserAction.setBadgeTextColor) {
      let color = prefs.badgeColorEnabled ? prefs.badgeColor : "transparent";
      browser.browserAction.setBadgeTextColor({color});
    }
  } else if (!prefs.countAll) {
    // Set a transparent icon globally to prevent the default icon from flickering
    // when opening a new window.
    browser.browserAction.setIcon({imageData: new ImageData(1, 1)});
  }

  // The windowId parameter was added in Firefox 62, polyfill it for previous versions.
  try {
    browser.browserAction.getBadgeText({windowId: browser.windows.WINDOW_ID_CURRENT});
  } catch (error) {
    windowIdPolyfill({
      title: "setTitle",
      text: "setBadgeText",
      path: "setIcon",
    }, prefs.countAll);
  }

  browser.tabs.onCreated.addListener(tabOnCreatedListener);
  browser.tabs.onRemoved.addListener(tabOnRemovedListener);
  if (!prefs.countAll) {
    browser.tabs.onAttached.addListener(tabOnAttachedListener);
    browser.tabs.onDetached.addListener(tabOnDetachedListener);
    browser.windows.onRemoved.addListener(windowOnRemovedListener);
    let windows = await browser.windows.getAll({populate: true});
    for (let {id, tabs: {length}} of windows) {
      update(id, length);
    }
  } else {
    let tabs = await browser.tabs.query({});
    update(allWindows, tabs.length);
  }
}

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request === "reload") {
    numTabs = new Map();
    lastTime = new Map();
    allWindows = undefined;

    browser.tabs.onCreated.removeListener(tabOnCreatedListener);
    browser.tabs.onRemoved.removeListener(tabOnRemovedListener);
    browser.tabs.onAttached.removeListener(tabOnAttachedListener);
    browser.tabs.onDetached.removeListener(tabOnDetachedListener);
    browser.windows.onRemoved.removeListener(windowOnRemovedListener);

    init()
  }
});

init();
