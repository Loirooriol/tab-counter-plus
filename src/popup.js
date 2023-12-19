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
  const [
    { length: thisWindow },
    { length: allWindows },
    { length: numWindows },
  ] = await Promise.all([
    browser.tabs.query({ currentWindow: true }),
    browser.tabs.query({}),
    browser.windows.getAll(),
  ]);
  document.getElementById("this-window").textContent = thisWindow;
  document.getElementById("all-windows").textContent = allWindows;
  document.getElementById("num-windows").textContent = numWindows;
})();

function copyTabs(tabs) {
  let copy_result_element = document.getElementById("copy-result");

  navigator.clipboard.writeText(tabs.map((tab) => tab.url).join("\n")).then(
    () => {
      /* clipboard successfully set */
      copy_result_element.innerHTML = `<p style="color:green;">Copied!</p>`;
    },
    () => {
      /* clipboard write failed */
      copy_result_element.innerHTML = `<p style="color:darkred;">Error</p>`;
    }
  );
}

let copy_button = document.getElementById("copy-button");
copy_button.addEventListener("click", () =>
  browser.tabs.query({}).then(copyTabs, {})
);
