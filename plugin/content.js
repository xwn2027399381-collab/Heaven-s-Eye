const MAX_TEXT_LENGTH = 6000;
const MAX_BATCH_ITEMS = 12;
const HIGHLIGHT_CLASS = "iv-risk-highlight";
const SELECTOR_CLASS = "iv-select-target";

let selectMode = false;
let currentHover = null;

function getVisibleText() {
  const blockedTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "CANVAS"]);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node.textContent.trim();
      if (!text || text.length < 20) return NodeFilter.FILTER_REJECT;
      if (blockedTags.has(node.parentElement?.tagName)) return NodeFilter.FILTER_REJECT;
      const style = window.getComputedStyle(node.parentElement);
      if (style.display === "none" || style.visibility === "hidden") {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const chunks = [];
  while (walker.nextNode() && chunks.join("\n").length < MAX_TEXT_LENGTH) {
    chunks.push(walker.currentNode.textContent.trim().replace(/\s+/g, " "));
  }
  return chunks.join("\n").slice(0, MAX_TEXT_LENGTH);
}

function absoluteUrl(value) {
  try {
    return new URL(value, location.href).href;
  } catch {
    return value || "";
  }
}

function collectImages() {
  return Array.from(document.images)
    .filter((img) => img.currentSrc || img.src)
    .slice(0, MAX_BATCH_ITEMS)
    .map((img) => ({
      type: "image",
      content: absoluteUrl(img.currentSrc || img.src),
      title: img.alt || img.title || "网页图片"
    }));
}

function collectLinks() {
  return Array.from(document.links)
    .filter((link) => link.href)
    .slice(0, MAX_BATCH_ITEMS)
    .map((link) => ({
      type: "url",
      content: absoluteUrl(link.href),
      title: link.textContent.trim().slice(0, 80) || link.href
    }));
}

function capturePage() {
  const text = getVisibleText();
  const items = [];
  if (text) {
    items.push({
      type: "text",
      content: text,
      title: document.title || "当前网页文本"
    });
  }
  return {
    url: location.href,
    title: document.title,
    items: [...items, ...collectImages(), ...collectLinks()]
  };
}

function clearHighlights() {
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((mark) => {
    const parent = mark.parentNode;
    mark.replaceWith(document.createTextNode(mark.textContent));
    parent.normalize();
  });
}

function highlightKeyword(keyword) {
  clearHighlights();
  const safeKeyword = String(keyword || "").trim();
  if (!safeKeyword) return 0;

  let count = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent.toLowerCase().includes(safeKeyword.toLowerCase())) {
        return NodeFilter.FILTER_REJECT;
      }
      if (node.parentElement?.closest(`.${HIGHLIGHT_CLASS}`)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    const text = node.textContent;
    const lower = text.toLowerCase();
    const target = safeKeyword.toLowerCase();
    let start = 0;
    const fragment = document.createDocumentFragment();

    while (true) {
      const index = lower.indexOf(target, start);
      if (index === -1) break;
      fragment.appendChild(document.createTextNode(text.slice(start, index)));
      const mark = document.createElement("mark");
      mark.className = HIGHLIGHT_CLASS;
      mark.textContent = text.slice(index, index + safeKeyword.length);
      fragment.appendChild(mark);
      start = index + safeKeyword.length;
      count += 1;
    }
    fragment.appendChild(document.createTextNode(text.slice(start)));
    node.replaceWith(fragment);
  });

  return count;
}

function targetToVerifyItem(target) {
  const link = target.closest("a[href]");
  if (link) {
    return {
      type: "url",
      content: absoluteUrl(link.href),
      title: link.textContent.trim().slice(0, 80) || link.href
    };
  }

  const image = target.closest("img[src], img[srcset]");
  if (image) {
    return {
      type: "image",
      content: absoluteUrl(image.currentSrc || image.src),
      title: image.alt || image.title || "网页图片"
    };
  }

  const selection = window.getSelection()?.toString().trim();
  if (selection) {
    return {
      type: "text",
      content: selection,
      title: "选中文本"
    };
  }

  const text = target.textContent?.trim().replace(/\s+/g, " ").slice(0, 1200);
  if (text && text.length >= 20) {
    return {
      type: "text",
      content: text,
      title: "点击区域文本"
    };
  }

  return null;
}

function setHoverTarget(target) {
  if (currentHover === target) return;
  currentHover?.classList.remove(SELECTOR_CLASS);
  currentHover = target;
  currentHover?.classList.add(SELECTOR_CLASS);
}

document.addEventListener("mousemove", (event) => {
  if (!selectMode) return;
  const target = event.target.closest("a[href], img, p, article, section, div");
  setHoverTarget(target);
}, true);

document.addEventListener("click", (event) => {
  if (!selectMode) return;
  const item = targetToVerifyItem(event.target);
  if (!item) return;

  event.preventDefault();
  event.stopPropagation();
  selectMode = false;
  setHoverTarget(null);
  chrome.runtime.sendMessage({ action: "verifyItems", items: [item] });
}, true);

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "capturePage") {
    sendResponse(capturePage());
    return true;
  }

  if (request.action === "highlightKeyword") {
    const count = highlightKeyword(request.keyword);
    sendResponse({ count });
    return true;
  }

  if (request.action === "clearHighlights") {
    clearHighlights();
    sendResponse({ ok: true });
    return true;
  }

  if (request.action === "enableSelectMode") {
    selectMode = true;
    sendResponse({ ok: true });
    return true;
  }

  return false;
});
