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
  bgColor: "#ffffff",
  bgColorEnabled: false,
  color: "#000000",
  colorEnabled: true,
  titlePrefix: "Open tabs: ",
  maxFontSize: 18,
  fontWeight: 100
};

let tabCounts = new Map();
let tabIndexes = new Map();
let lastTime = new Map();
let allWindows = undefined;

function updateIcon(windowId, tabNum = -1, tabCount = -1) {
  // Debounce if there are multiple calls in a short amount of time.
  let last = lastTime.get(windowId);
  let notDelayed = tabNum != -1 && tabCount != -1;
  if (notDelayed && last == -1) {
    // There is a queued call.
    return;
  }
  let now = performance.now();
  let time = 250 - now + last;
  if (notDelayed && time > 0) {
    setTimeout(updateIcon, time, windowId);
    lastTime.set(windowId, -1);
    return;
  }
  lastTime.set(windowId, now);
  if (!notDelayed) {
    tabNum = tabIndexes.get(windowId);
    tabCount = tabCounts.get(windowId);
  }

  // Show the counter
  let text = tabNum + "/" + tabCount;
  let title = prefs.titlePrefix + text;
  browser.browserAction.setTitle({ title, windowId });

  let parseColor = function(color, enabled) {
    return enabled ? color.replace(/[^#\w]/g, "") : "transparent";
  };
  let len = text.length;
  let fontSize = 20-len;
  if(fontSize > prefs.maxFontSize) fontSize = prefs.maxFontSize;
  // for text-anchor below: Can use 'start' and replace x="50%" below with x="0%"...
  let path = "data:image/svg+xml," + encodeURIComponent(`<?xml version="1.0" encoding="utf-8"?>
  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="56" height="28">
    <style type="text/css"><![CDATA[
    text {
      dominant-baseline: central;
      font-family: Consolas, monospace;
      font-size: ${fontSize}px;
      font-weight: ${prefs.fontWeight};
      text-anchor: middle;
      fill: ${parseColor(prefs.color, prefs.colorEnabled)};
    }
    svg {
      background-color: ${parseColor(prefs.bgColor, prefs.bgColorEnabled)};
    }
    ]]></style>
    <text x="50%" y="50%"
      ${len > 8 ? 'textLength="100%"' : ''}
      ${len > 8 ? 'lengthAdjust="spacingAndGlyphs"' : ''}
    >${text}</text>
  </svg>`);
  browser.browserAction.setIcon({ path, windowId });
  
}

function updateTabIndexAndCount(windowId, zeroBasedTabIndex, tabCount) {
  var tabIndex = zeroBasedTabIndex+1;
  tabIndexes.set(windowId, tabIndex);
  tabCounts.set(windowId, tabCount);
  updateIcon(windowId, tabIndex, tabCount);
};

function incrementTabCount(windowId, increment) {
  if (prefs.countAll) {
    windowId = allWindows;
  }
  let tabCount = tabCounts.get(windowId) || 0;
  tabCount += increment;
  updateTabIndexWithTabCount(windowId, tabCount)
}


(async () => {
  prefs = await browser.storage.local.get(prefs);
  browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request === "getPrefs") {
      sendResponse(prefs);
    }
  });

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

  browser.windows.onCreated.addListener(function ({id}) {
    incrementTabCount(id, +1);
  });

  browser.tabs.onCreated.addListener(function ({windowId}) {
    incrementTabCount(windowId, +1);
  });

  browser.tabs.onRemoved.addListener(function (tabId, {windowId, isWindowClosing}) {
    if (!isWindowClosing) {
      incrementTabCount(windowId, -1);
    }
  });

  browser.tabs.onActivated.addListener(({windowId, tabId}) => {
    updateTabIndexByTabId(windowId, tabId);
  });

  browser.tabs.onMoved.addListener((tabId, moveInfo) => {
    updateTabIndexAndCount(moveInfo.windowId, moveInfo.toIndex, tabCounts.get(moveInfo.windowId));
  });

  if (!prefs.countAll) {
    browser.tabs.onAttached.addListener(function (tabId, {newWindowId}) {
      incrementTabCount(newWindowId, +1);
    });
    browser.tabs.onDetached.addListener(function (tabId, {oldWindowId}) {
      incrementTabCount(oldWindowId, -1);
    });
    browser.windows.onRemoved.addListener(function (windowId) {
      tabCounts.delete(windowId);
      tabIndexes.delete(windowId);
      lastTime.delete(windowId);
    });

    let windows = await browser.windows.getAll({populate: true});
    for (let {id, tabs: {length}} of windows) {
      updateTabIndexWithTabCount(id, length);
    }

  } else {
    let tab = await browser.tabs.query({active: true});
    updateTabIndexAndCount(allWindows, tab.index);
  }
})();

function updateTabIndexWithTabCount(windowId, tabCount) {
  // No tabId, get the active tab:
  var getTab = browser.tabs.query({active: true, windowId: windowId});

  getTab.then((tab) => {
      updateTabIndexAndCount(windowId, tab[0].index, tabCount);
  });
};

function updateTabIndexByTabId(windowId, tabId) {
  var getWindow = browser.windows.get(windowId, {populate: true});
  var getTab = browser.tabs.get(tabId);

  Promise.all([getWindow, getTab]).then((results) => {
      var _window = results[0];
      var tab = results[1];
      updateTabIndexAndCount(windowId, tab.index, _window.tabs.length);
  });
}

function updateTabIndex(windowId, tab, tabCount = -1) {
  if(tabCount == -1) {
      tabCount = tabCounts.get(windowId) || -2;
  }
  updateTabIndexAndCount(windowId, tab.index, tabCount);
};
