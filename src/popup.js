//
// Copyright 2018 Oriol Brufau
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

(async () => {
  const windowList = await browser.windows.getAll();

  let thisWindow = 0;
  let allWindows = 0;
  const numWindows = windowList.length;

  const windowTabs = new Map();
  for (const windowInfo of windowList) {
    const id = windowInfo.id;
    const count = (await browser.tabs.query({windowId: id})).length;
    windowTabs.set(id, count);
    if (windowInfo.focused) {
      thisWindow = count;
    }
    allWindows += count;
  }

  document.getElementById("this-window").textContent = thisWindow;
  document.getElementById("all-windows").textContent = allWindows;
  document.getElementById("num-windows").textContent = numWindows;

  const elmDetails = document.getElementById("tabs-windows");
  for (const count of windowTabs.values()) {
    const elmCount = document.createElement("li");
    elmCount.textContent = count;
    elmDetails.appendChild(elmCount);
  };
})();
