const API_BASE_URL = "http://127.0.0.1:8000";
const STORAGE_KEY = "infoVerifierResults";

async function readSettings() {
  const data = await chrome.storage.local.get(["apiBaseUrl"]);
  return {
    apiBaseUrl: data.apiBaseUrl || API_BASE_URL
  };
}

async function saveResults(results) {
  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      updatedAt: new Date().toISOString(),
      results
    }
  });
}

async function verifyOne(item) {
  const { apiBaseUrl } = await readSettings();
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type: item.type,
      content: item.content
    })
  });

  if (!response.ok) {
    throw new Error(`API 请求失败：${response.status}`);
  }

  const data = await response.json();
  return {
    ...item,
    result: data,
    analyzedAt: new Date().toISOString()
  };
}

async function verifyItems(items) {
  const limitedItems = items.slice(0, 12);
  const settled = await Promise.allSettled(limitedItems.map(verifyOne));
  const results = settled.map((entry, index) => {
    if (entry.status === "fulfilled") return entry.value;
    return {
      ...limitedItems[index],
      error: entry.reason?.message || "分析失败",
      analyzedAt: new Date().toISOString()
    };
  });
  await saveResults(results);
  return results;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "verify-selection",
    title: "分析选中文本真实性",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "verify-link",
    title: "分析链接真实性",
    contexts: ["link"]
  });
  chrome.contextMenus.create({
    id: "verify-image",
    title: "分析图片真实性",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  const items = [];
  if (info.menuItemId === "verify-selection" && info.selectionText) {
    items.push({ type: "text", content: info.selectionText, title: "右键选中文本" });
  }
  if (info.menuItemId === "verify-link" && info.linkUrl) {
    items.push({ type: "url", content: info.linkUrl, title: "右键链接" });
  }
  if (info.menuItemId === "verify-image" && info.srcUrl) {
    items.push({ type: "image", content: info.srcUrl, title: "右键图片" });
  }
  if (items.length) await verifyItems(items);
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "verifyItems") {
    verifyItems(request.items || [])
      .then((results) => sendResponse({ ok: true, results }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (request.action === "getResults") {
    chrome.storage.local.get([STORAGE_KEY]).then((data) => {
      sendResponse(data[STORAGE_KEY] || { results: [] });
    });
    return true;
  }

  if (request.action === "setApiBaseUrl") {
    chrome.storage.local.set({ apiBaseUrl: request.apiBaseUrl }).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }

  return false;
});
