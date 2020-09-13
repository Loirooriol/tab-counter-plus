# Tab Counter Plus

This WebExtension shows the number of tabs in each Firefox window. It's efficient and customizable.

![screenshot](https://user-images.githubusercontent.com/7477678/41196910-b9a322f6-6c4c-11e8-94f9-5f50f24a73b0.png)

### Download

You can download it from [Releases](https://github.com/Loirooriol/tab-counter-plus/releases) or from [Firefox Add-ons (AMO)](https://addons.mozilla.org/firefox/addon/tab-counter-plus).

### Features

:heavy_check_mark: Can count the number of tabs in each window or among all.

:heavy_check_mark: Two display modes: SVG text icon or WebExtension badge.

:heavy_check_mark: Colors and title are customizable.

:heavy_check_mark: Works with multiple windows side by side (not easy due to WebExtension limitations).

:heavy_check_mark: Small performance impact. Most other tab counter extensions continuously query all tabs to count them. That's an expensive operation, which Tab Counter Plus avoids by storing the numbers and updating them on various events.

:heavy_check_mark: Intelligent debouncing. If lots of tabs are opened or closed in a short period of time (e.g. when restoring previous session during startup), the webextension will delay the update of the counter.

:heavy_check_mark: Very fast. Tab Counter Plus avoids asynchronicity as much as possible in order to achieve a faster update of the counter. In particular, no delay when removing tabs (usual in other tab counter due to WebExtension limitations).

:heavy_check_mark: Light-weight. Coded in fast vanilla-js, no bloating libraries.

:sparkles: I designed and implemented a new WebExtension feature that allows to achieve all the above in a much more robust, simple and efficient way. It's included since Tab Counter Plus version 2.0, targetting Firefox 62.

### Why another tab counter add-on?

The great [Michael Kraft's Tab Counter](https://web.archive.org/web/20171114170649/https://addons.mozilla.org/en-US/firefox/addon/tab-counter/) doesn't work in Firefox Quantum. Some tab counter WebExtensions appeared, but WebExtension limitations made it difficult to create a good tab counter. Therefore, I decided to write my own extension which bypasses the issues as best as I could, and in parallel I started adding new WebExtension features to solve them.
