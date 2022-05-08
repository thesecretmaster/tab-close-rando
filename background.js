async function tab_calc() {
  return await chrome.windows.getAll({populate: true}).then(windows => {
    let tc = 0;
    windows.forEach(function (w) {
      tc += w.tabs.length;
      console.log(tc + ' ' + w.tabs.length);
    });
    return tc;
  });
}

async function tabcount_get() {
  return (await chrome.storage.local.get(['tab_count'])).tab_count;
}

function tabcount_set(i) {
  chrome.storage.local.set({'tab_count': i});
}

async function try_set_day(tc) {
  const today = new Date();
  const today_date = [today.getFullYear(), today.getMonth(), today.getDate()];
  let last_check_info = await chrome.storage.local.get(['last_update_date', 'today_base_tabcount']);
  const last_check_date = last_check_info.last_update_date;
  if (!(Array.isArray(last_check_date) && last_check_date.length === today_date.length && today_date.every((e, i) => e === last_check_date[i]))) {
    console.log("New day baybe");
    let sod_data = (await chrome.storage.local.get(['sod_data'])).sod_data;
    if (sod_data === undefined) {
      sod_data = {};
    }
    sod_data[today_date] = tc;
    last_check_info = {'last_update_date': today_date, 'today_base_tabcount': tc};
    chrome.storage.local.set({...last_check_info, 'sod_data': sod_data});
  }
  return tc - last_check_info.today_base_tabcount;
}

async function tabcount_update(tc, today_diff) {
  tabcount_set(tc);
  chrome.action.setBadgeText({text:today_diff.toString()});
  if (today_diff <= 0) {
    chrome.action.setBadgeBackgroundColor({color: [0,180,0,1]});
  } else {
    chrome.action.setBadgeBackgroundColor({color: [255,0,0,1]});
  }
}

async function tabcount_reset() {
  let tc = await tab_calc();
  console.log("Running startup!" + tc);
  await tabcount_update(tc, await try_set_day(tc));
}

async function tabcount_setzero() {
  await tabcount_update(tc, await try_set_day(0));
}

chrome.tabs.onRemoved.addListener(async function(tabId, data) {
  let tc = await tabcount_get();
  let today_diff = await try_set_day(tc);
  tc -= 1;
  today_diff -= 1;
  await tabcount_update(tc, today_diff);
  if (!data.isWindowClosing) {
    console.log('Closed ' + tabId + ' in win ' + data.windowId);
  } else {
    console.log('Closing window ' + data.windowId);
  }
});

chrome.tabs.onCreated.addListener(async function(tab) {
  let tc = await tabcount_get();
  let today_diff = await try_set_day(tc);
  tc += 1;
  today_diff += 1;
  await tabcount_update(tc, today_diff);
  console.log('Opened ' + tab.id + ' in win ' + tab.windowId);
});

chrome.tabs.onDetached.addListener(function(tabId, data) {
  console.log('Detatched ' + tabId);
  console.log(data);
});

chrome.tabs.onUpdated.addListener(function(tabId, data, tab) {
  // ok this is like url change
  console.log('Updated ' + tabId + ' in win ' + tab.windowId);
  console.log(data);
});

async function close_tab() {
  let tabs = []
  await chrome.windows.getAll({populate: true}).then(windows => {
    windows.forEach(function (w) {
      tabs = tabs.concat(w.tabs);
    });
  });
  console.log("Close tab timer");
  if (tabs.length > 1) {
    console.log("Close tab ");
    console.log(tabs)
    let ti = Math.floor(Math.random()*tabs.length);
    console.log(tabs[ti].id);
    await chrome.tabs.remove(tabs[ti].id);
  }
  setTimeout(close_tab, Math.floor((Math.random()*60000)));
}
setTimeout(close_tab, 5000)
chrome.action.onClicked.addListener(function(tab) {
    close_tab();
});
chrome.runtime.onInstalled.addListener(tabcount_reset);
chrome.runtime.onStartup.addListener(tabcount_setzero);
chrome.idle.onStateChanged.addListener(tabcount_reset);
