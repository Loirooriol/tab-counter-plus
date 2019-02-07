/*
 * Copyright 2018 Oriol Brufau
 * Additions 2019 by Jonathon Merz
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


// Tab count UPDATE operations: These can be combined
let UPDATE_ACTION_UPDATE_INDEX = 1;                                                                             // 0001
let UPDATE_ACTION_UPDATE_VISIBLE_COUNT = 2;                                                                     // 0010
let UPDATE_ACTION_UPDATE_HIDDEN_COUNT = 4;                                                                      // 0100
let UPDATE_ACTION_UPDATE_ALL_COUNTS = UPDATE_ACTION_UPDATE_VISIBLE_COUNT | UPDATE_ACTION_UPDATE_HIDDEN_COUNT;   // 0110
let UPDATE_ACTION_UPDATE_ALL = UPDATE_ACTION_UPDATE_ALL_COUNTS | UPDATE_ACTION_UPDATE_INDEX;                    // 0111

// Tab actions - things done to a tab: These are all mutually exclusive
let TAB_ACTION_ACTIVATED = 1;
let TAB_ACTION_MOVED = 2;
let TAB_ACTION_CREATED = 3;
let TAB_ACTION_REMOVED = 4;

let HIDDEN_TABS_DO_NOT_SHOW = "doNotShow";
let HIDDEN_TABS_SHOW_WHEN_PRESENT = "showWhenPresent";
let HIDDEN_TABS_SHOW_WHEN_ZERO = "showWhenZero";

let prefs = {
  actionIconHeightPx: 28,
  actionIconWidthPx: 56,
  bgColor: "#ffffff",
  bgColorEnabled: false,
  textColor: "#000000",
  textColorEnabled: true,
  hiddenTabsOption: HIDDEN_TABS_SHOW_WHEN_PRESENT,
  titleCurrentTabPrefix:  "Current tab: ",
  titleVisibleTabsPrefix: "Open tabs:   ",
  titleHiddenTabsPrefix:  "Hidden tabs: ",
  maxFontSize: 18,
  fontWeight: 100
};

function UpdateInfo(updateAction, tabAction, tabId) {
  this.updateAction = updateAction;
  this.tabAction = tabAction;
  this.tabId = tabId;
};

let DEFAULT_UPDATE_INFO = new UpdateInfo(UPDATE_ACTION_UPDATE_ALL, null, null);

let visibleTabCounts = new Map();
let hiddenTabCounts = new Map();
let tabIndexes = new Map();
let lastTime = new Map();
let removedTabIds = new Set();


function updateIcon(windowId, tabNum = -1, tabCount = -1, hiddenTabCount = -1) {
  // Debounce if there are multiple calls in a short amount of time.
  let last = lastTime.get(windowId);
  let notDelayed = tabNum != -1 && tabCount != -1 && hiddenTabCount != -1;
  if (notDelayed && last == -1) {
    // There is a queued call.
    return;
  }
  let now = performance.now();
  let time = 250 - now + last;
  if (notDelayed && time > 0) {
    setTimeout(updateIcon, time, windowId);
    lastTime.set(windowId, -1); // TODO: Is this logic right?
    return;
  }
  lastTime.set(windowId, now);
  if (!notDelayed) {
    tabNum = tabIndexes.get(windowId);
    tabCount = visibleTabCounts.get(windowId);
    hiddenTabCount = hiddenTabCounts.get(windowId);
  }

  // Show the counter
  let showHiddenTabs = prefs.hiddenTabsOption == HIDDEN_TABS_SHOW_WHEN_ZERO || (prefs.hiddenTabsOption == HIDDEN_TABS_SHOW_WHEN_PRESENT && hiddenTabCount > 0);
  let text = tabNum + "/" + tabCount + (showHiddenTabs ? (" (" + hiddenTabCount + ")") : "");
  let title = prefs.titleCurrentTabPrefix + tabNum;
  title += "\n" + prefs.titleVisibleTabsPrefix + tabCount;
  title += "\n" + prefs.titleHiddenTabsPrefix + hiddenTabCount;

  browser.browserAction.setTitle({ title, windowId });

  let parseColor = function(color, enabled) {
    return enabled ? color.replace(/[^#\w]/g, "") : "transparent";
  };
  let len = text.length;
  let fontSize = 26-len;
  if(fontSize > prefs.maxFontSize) fontSize = prefs.maxFontSize;
  // for text-anchor below: Can use 'start' and replace x="50%" below with x="0%"...
  // TODO: Try making font selectable? Other font: Consolas
  let path = "data:image/svg+xml," + encodeURIComponent(`<?xml version="1.0" encoding="utf-8"?>
  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${prefs.actionIconWidthPx}" height="${prefs.actionIconHeightPx}">
    <style type="text/css"><![CDATA[
    text {
      dominant-baseline: central;
      font-family: monospace;
      font-size: ${fontSize}px;
      font-weight: ${prefs.fontWeight};
      text-anchor: middle;
      fill: ${parseColor(prefs.textColor, prefs.textColorEnabled)};
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

function updateTabIndexAndCount(windowId, zeroBasedTabIndex, tabCount, hiddenTabCount) {
  let tabIndex = zeroBasedTabIndex;//+1;
  tabIndexes.set(windowId, tabIndex);
  visibleTabCounts.set(windowId, tabCount);
  hiddenTabCounts.set(windowId, hiddenTabCount);
  updateIcon(windowId, tabIndex, tabCount, hiddenTabCount);
};

function updateTabCountsAndIndexForWindow(windowId, updateInfo) {
  let getAllTabsInWindow = browser.tabs.query({windowId: windowId});
  getAllTabsInWindow.then((tabs) => {
    updateTabCountsAndIndexForTabsInWindow(windowId, tabs, updateInfo);
  });
};

function updateTabCountsAndIndexForTabsInWindow(windowId, tabs, updateInfo = DEFAULT_UPDATE_INFO) {
  let visibleTabCount = 0;
  let hiddenTabCount = 0;
  let currentTabIndex = 0;

  for(let tab of tabs) {
    // If the tab was removed, and it's still in the tab list, don't count it
    if(removedTabIds.has(tab.id)) {
      continue;
    }

    if(tab.hidden) {
      hiddenTabCount++;
    } else {
      visibleTabCount++;
      if(tab.active) {
        currentTabIndex = visibleTabCount;
      }
    }
  }

  // If we are not requested to update the visible tab count, reset the value
  if(!(updateInfo.updateAction & UPDATE_ACTION_UPDATE_VISIBLE_COUNT)) {
    visibleTabCount = visibleTabCounts.get(windowId);
  }

  // If we are not requested to update the hidden tab count, reset the value
  if(!(updateInfo.updateAction & UPDATE_ACTION_UPDATE_HIDDEN_COUNT)) {
    hiddenTabCount = hiddenTabCounts.get(windowId);
  }

  // If we are not requested to update the tab index, reset the value
  if(!(updateInfo.updateAction & UPDATE_ACTION_UPDATE_INDEX)) {
    currentTabIndex = tabIndexes.get(windowId);
  }

  updateTabIndexAndCount(windowId, currentTabIndex, visibleTabCount, hiddenTabCount);
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
  console.log("setting polyfill");
    windowIdPolyfill({
      title: "setTitle",
      text: "setBadgeText",
      path: "setIcon",
    }, false);
  }

  function markTabRemoved(tabId) {
    removedTabIds.add(tabId);
    // Remove this id after 1 second so we don't accumulate ids forever
    setTimeout(() => {
      removedTabIds.delete(tabId)
    }, 1000);
  }

  browser.windows.onCreated.addListener(function ({id}) {
    //console.log("windows.onCreated: windowId: " + id);
    updateTabCountsAndIndexForWindow(id);
  });

  browser.windows.onRemoved.addListener(function (windowId) {
    //console.log("windows.onRemoved: windowId: " + windowId);
    visibleTabCounts.delete(windowId);
    hiddenTabCounts.delete(windowId);
    tabIndexes.delete(windowId);
    lastTime.delete(windowId);
  });

  browser.tabs.onCreated.addListener(function ({id, hidden, windowId}) {
    //console.log("tabs.onCreated: tabId: " + id);
    updateTabCountsAndIndexForWindow(windowId);
  });

  // When a tab is removed, if it is not because the window is closing, re-count all tabs and
  // re-figure index, decrementing the visible tab count by 1 since the the tab will still be
  // present in the list
  browser.tabs.onRemoved.addListener(function (tabId, {windowId, isWindowClosing}) {
    //console.log("tabs.onRemoved: tabId: " + tabId);
    if (!isWindowClosing) {
      markTabRemoved(tabId);
      let updateInfo = new UpdateInfo(UPDATE_ACTION_UPDATE_ALL, TAB_ACTION_REMOVED, tabId);
      updateTabCountsAndIndexForWindow(windowId, updateInfo);
    }
  });

  browser.tabs.onActivated.addListener(({windowId, tabId}) => {
    //console.log("tabs.onActivated: tabId: " + tabId);
    let updateInfo = new UpdateInfo(UPDATE_ACTION_UPDATE_INDEX, TAB_ACTION_ACTIVATED, tabId);
    updateTabCountsAndIndexForWindow(windowId, updateInfo);
  });

  browser.tabs.onMoved.addListener((tabId, moveInfo) => {
    //console.log("tabs.onMoved: tabId: " + tabId);
    let updateInfo = new UpdateInfo(UPDATE_ACTION_UPDATE_INDEX, TAB_ACTION_MOVED, tabId);
    updateTabCountsAndIndexForWindow(moveInfo.windowId, updateInfo);
  });

  browser.tabs.onAttached.addListener(function (tabId, {newWindowId}) {
    //console.log("tabs.onAttached: tabId: " + tabId);
    updateTabCountsAndIndexForWindow(newWindowId);
  });

  browser.tabs.onDetached.addListener(function (tabId, {oldWindowId}) {
    //console.log("tabs.onDetached: tabId: " + tabId);
    updateTabCountsAndIndexForWindow(oldWindowId);
  });

  // Use onUpdated with a filter to catch only for the "hidden" property as an
  // "onHidden"/"onUnhidden" handler.
  browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    updateTabCountsAndIndexForWindow(tab.windowId);
  }, {properties: ["hidden"]});

  // Initialize the counts at startup
  let windows = await browser.windows.getAll({populate: true});
  for (let {id, tabs} of windows) {
    updateTabCountsAndIndexForTabsInWindow(id, tabs);
  }

})();

