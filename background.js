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
    let parseColor = function(color, enabled) {
      return enabled ? color.replace(/[^#\w]/g, "") : "transparent";
    };
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
    browser.browserAction.setIcon({ path, windowId });
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

    // Badge text color was added in Firefox 63
    if (browser.browserAction.setBadgeTextColor) {
      let color = prefs.badgeColorEnabled ? prefs.badgeColor : "transparent";
      browser.browserAction.setBadgeTextColor({color});
    }
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

  browser.tabs.onCreated.addListener(function ({windowId}) {
    increase(windowId, +1);
  });
  browser.tabs.onRemoved.addListener(function (tabId, {windowId, isWindowClosing}) {
    if (!isWindowClosing || prefs.countAll) {
      increase(windowId, -1);
    }
  });
  if (!prefs.countAll) {
    browser.tabs.onAttached.addListener(function (tabId, {newWindowId}) {
      increase(newWindowId, +1);
    });
    browser.tabs.onDetached.addListener(function (tabId, {oldWindowId}) {
      increase(oldWindowId, -1);
    });
    browser.windows.onRemoved.addListener(function (windowId) {
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
})();
