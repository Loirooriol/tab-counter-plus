# Tab Counter Plus Plus (JMM)

This is a fork of Loirooriol's fantastic [Tab Counter Plus](https://github.com/Loirooriol/tab-counter-plus) to do some slightly messy customization. This may not be kept entirely up to date with the original repo. Please see the README on that page for full details.

This provides the ability to include the current tab index in addition to the total number of tabs in the window.

**TODO: Screenshot**

This is accomplished by **requiring** the following to be added to the userChrome.css file:
``` css
/* Normally has right/left-padding of 1px - remove it all */
toolbarbutton#tab-counter-plus-plus-jmm_jmmerz_github-browser-action {
    padding-left: 0px !important;
    padding-right: 0px !important;
}
/* Normally has right/left-padding of 6px - remove it all */
toolbarbutton#tab-counter-plus-plus-jmm_jmmerz_github-browser-action > .toolbarbutton-badge-stack {
    padding-top: 0px !important;
    padding-bottom: 0px !important;
    padding-left: 0px !important;
    padding-right: 0px !important;
}

/* Standard height/width is 16px/16px. Tabbar height is 28px so that's pretty fixed,
 * but we can adjust width as needed. These should match the icon dimensions in the code. */
toolbarbutton#tab-counter-plus-plus-jmm_jmmerz_github-browser-action > .toolbarbutton-badge-stack > .toolbarbutton-icon {
    height: 28px !important;
    width: 56px !important;
}
```
