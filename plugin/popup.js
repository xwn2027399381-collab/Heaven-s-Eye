const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const inputEl = document.getElementById("inputContent");
const typeEl = document.getElementById("contentType");
const apiBaseUrlEl = document.getElementById("apiBaseUrl");

function setStatus(message, tone = "neutral") {
  statusEl.textContent = message;
  statusEl.dataset.tone = tone;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function scoreClass(score) {
  if (score >= 80) return "good";
  if (score >= 50) return "warn";
  return "bad";
}

function renderResults(results) {
  if (!results?.length) {
    resultEl.innerHTML = '<p class="empty">暂无分析结果</p>';
    return;
  }

  resultEl.innerHTML = results.map((item) => {
    if (item.error) {
      return `
        <article class="card">
          <h2>${escapeHtml(item.title || item.type)}</h2>
          <p class="error">${escapeHtml(item.error)}</p>
        </article>
      `;
    }

    const data = item.result || {};
    const score = Number(data["可信度"] ?? 0);
    const labels = Array.isArray(data["风险标签"]) ? data["风险标签"] : [];
    const reasons = data["风险说明"] || {};
    const suggestions = Array.isArray(data["验证建议"]) ? data["验证建议"] : [];
    const evidence = Array.isArray(data["证据链"]) ? data["证据链"] : [];

    return `
      <article class="card">
        <div class="card-head">
          <h2>${escapeHtml(item.title || item.type)}</h2>
          <strong class="score ${scoreClass(score)}">${score}</strong>
        </div>
        <p class="content">${escapeHtml(item.content).slice(0, 220)}</p>
        <div class="tags">
          ${labels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}
        </div>
        <h3>风险说明</h3>
        <ul>
          ${Object.entries(reasons).map(([label, reason]) => (
            `<li><b>${escapeHtml(label)}</b>：${escapeHtml(reason)}</li>`
          )).join("")}
        </ul>
        <h3>验证建议</h3>
        <ul>${suggestions.map((text) => `<li>${escapeHtml(text)}</li>`).join("")}</ul>
        <h3>证据链</h3>
        <ul>${evidence.map((text) => `<li>${escapeHtml(text)}</li>`).join("") || "<li>暂无</li>"}</ul>
      </article>
    `;
  }).join("");
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToActiveTab(message) {
  const tab = await getActiveTab();
  return chrome.tabs.sendMessage(tab.id, message);
}

function verifyItems(items) {
  return chrome.runtime.sendMessage({ action: "verifyItems", items });
}

document.getElementById("saveApiBtn").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({
    action: "setApiBaseUrl",
    apiBaseUrl: apiBaseUrlEl.value.trim() || "http://127.0.0.1:8000"
  });
  setStatus("已保存", "good");
});

document.getElementById("analyzeBtn").addEventListener("click", async () => {
  const content = inputEl.value.trim();
  if (!content) {
    setStatus("请输入内容", "bad");
    return;
  }

  setStatus("分析中");
  const response = await verifyItems([{ type: typeEl.value, content, title: "手动输入" }]);
  if (!response.ok) {
    setStatus(response.error || "分析失败", "bad");
    return;
  }
  renderResults(response.results);
  setStatus("完成", "good");
});

document.getElementById("captureBtn").addEventListener("click", async () => {
  setStatus("捕获网页中");
  const page = await sendToActiveTab({ action: "capturePage" });
  setStatus(`分析 ${page.items.length} 条内容`);
  const response = await verifyItems(page.items);
  if (!response.ok) {
    setStatus(response.error || "分析失败", "bad");
    return;
  }
  renderResults(response.results);
  setStatus("完成", "good");
});

document.getElementById("selectBtn").addEventListener("click", async () => {
  await sendToActiveTab({ action: "enableSelectMode" });
  setStatus("请在网页中点击图片、链接或文本", "warn");
});

document.getElementById("highlightBtn").addEventListener("click", async () => {
  const keyword = document.getElementById("highlightKeyword").value.trim();
  const response = await sendToActiveTab({ action: "highlightKeyword", keyword });
  setStatus(`已高亮 ${response.count} 处`, "good");
});

document.getElementById("clearHighlightBtn").addEventListener("click", async () => {
  await sendToActiveTab({ action: "clearHighlights" });
  setStatus("已清除", "good");
});

chrome.runtime.sendMessage({ action: "getResults" }).then((data) => {
  renderResults(data.results || []);
});

chrome.storage.local.get(["apiBaseUrl"]).then((data) => {
  if (data.apiBaseUrl) apiBaseUrlEl.value = data.apiBaseUrl;
});
