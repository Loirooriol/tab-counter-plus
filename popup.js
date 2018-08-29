/*
 * Copyright 2018 Oriol Brufau
 * Additions 2018 by Jonathon Merz
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

(async function() {
  let {length: thisWindow} = await browser.tabs.query({currentWindow: true});
  let {length: allWindows} = await browser.tabs.query({});
  document.getElementById('thisWindow').textContent = thisWindow;
  document.getElementById('allWindows').textContent = allWindows;
})();
