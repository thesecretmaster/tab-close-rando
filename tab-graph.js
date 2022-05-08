function loadWindowList() {
  chrome.windows.getAll({ populate: true }, function(windowList) {
    tabs = {};
    tabIds = [];
    for (var i = 0; i < windowList.length; i++) {
      windowList[i].current = (windowList[i].id == currentWindowId);
      windowList[i].focused = (windowList[i].id == focusedWindowId);

      for (var j = 0; j < windowList[i].tabs.length; j++) {
        tabIds[tabIds.length] = windowList[i].tabs[j].id;
        tabs[windowList[i].tabs[j].id] = windowList[i].tabs[j];
      }
    }

    var input = new JsExprContext(windowList);
    var output = document.getElementById('windowList');
    jstProcess(input, output);
  });
}

function init() {
  console.log("hello world");
}

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.create({url:chrome.extension.getURL("tab-graph.html")});
});
