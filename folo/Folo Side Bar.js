// ==UserScript==
// @name         Folo Side Bar
// @namespace    http://tampermonkey.net/
// @version      2025-08-15
// @description  Toggle show or hide side bar
// @author       Ray
// @match        https://app.follow.is/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ======== 配置区域 ========
    const menuSelector = '#follow-app-grid-container';
    const listSelector = "div[class='h-full shrink-0 border-r will-change-[width]']";
    const colorShow = '#4ade80'; // 显示状态颜色 (绿色)
    const colorHide = '#f87171'; // 隐藏状态颜色 (红色)
    const articleContent = '#follow-entry-render'; // 正文区域
    const wordsCountSelector = '.text-text-secondary.flex.items-center.gap-4'; // 字数统计
    const readingSpeed = 300; // 阅读速度
    // =========================

    /**
     * 创建一个切换指定元素显示/隐藏的按钮
     * @param {string} targetSelector - 目标元素的 CSS 选择器
     * @param {string} top - 按钮距离顶部的位置（例如 "68px"）
     * @param {string} textContent - 按钮内容
     */
    function createButton(targetSelector, top, textContent) {
        const btn = document.createElement('div');
        btn.style.position = 'fixed';
        btn.style.top = top;
        btn.style.right = '12px';
        btn.style.width = '40px';
        btn.style.height = '40px';
        btn.style.borderRadius = '50%';
        btn.style.color = '#333';
        btn.style.backgroundColor = colorShow;
        btn.style.cursor = 'pointer';
        btn.style.zIndex = '9999';
        btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';

        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.lineHeight = '1';
        btn.style.fontSize = '12px';
        btn.textContent = textContent;

        btn.addEventListener('click', () => {
            const target = document.querySelector(targetSelector);
            if (!target) return alert('未找到目标元素');
            if (target.style.display === 'none') {
                target.style.display = '';
                btn.style.backgroundColor = colorShow;
            } else {
                target.style.display = 'none';
                btn.style.backgroundColor = colorHide;
            }
        });

        document.body.appendChild(btn);
    }

    function queryShadow(selector, root = document) {
        // 先查找普通 DOM
        let el = root.querySelector(selector);
        if (el) return el;

        // 遍历 shadow root
        const all = root.querySelectorAll('*');
        for (const node of all) {
            if (node.shadowRoot) {
                const found = queryShadow(selector, node.shadowRoot);
                if (found) return found;
            }
        }
        return null;
    }

    function countWords(text) {
        // 中文直接算字数；英文单词可以按字母数或单词数
        let chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        let otherChars = (text.match(/\b[a-zA-Z0-9]+\b/g) || []).length;

        return chineseChars + otherChars;
    }

    function createDiv(idName, className) {
        const div = document.createElement('div');
        if (idName) div.id = idName;
        if (className) div.className = className;

        return div;
    }

    function createIconInfo(root, id, iconClass) {
        const div = createDiv(id, 'flex items-center gap-1.5');
        root.appendChild(div);

        const icon = document.createElement('i');
        icon.className = `${iconClass} text-base`;

        const span = document.createElement('span');
        span.className = 'text-xs tabular-nums';

        div.appendChild(icon);
        div.appendChild(span);

        return span;
    }

    function estimateReadTime(words, speed = 300) {
        // speed = 每分钟阅读字数
        const minutes = words / speed;
        if (minutes < 1) {
            return `${Math.ceil(minutes*60)} sec`;
        } else {
            return `${Math.ceil(minutes)} min`;
        }
    }

    function showWordsCount(article) {
        const count = countWords(article.innerText || '');
        console.log("正文字数统计：", count);

        let toolbar = document.querySelector(wordsCountSelector);
        if (!toolbar) return;

        // 字数统计
        let wordsCount = document.querySelector('#wordsCount .text-xs.tabular-nums')
        if (!wordsCount) {
            wordsCount = createIconInfo(toolbar, 'wordsCount', 'i-mgc-docment-cute-re');
        }
        wordsCount.textContent = `${count} 字`;

        // 估算阅读时长
        let estimateTime = document.querySelector('#estimateTime .text-xs.tabular-nums')
        if (!estimateTime) {
            estimateTime = createIconInfo(toolbar, 'estimateTime', 'i-mgc-time-cute-re');
        }
        let esTime = estimateReadTime(count, readingSpeed);
        estimateTime.textContent = esTime;
    }

    function observeArticle() {
        // 监听 DOM 变化
        const observer = new MutationObserver(() => {
            let article = queryShadow(articleContent);
            if (article && article.innerText.trim().length > 0) {
                // Words count
                showWordsCount(article);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // 监听 SPA 路由变化
    function hookSPA() {
        const origPush = history.pushState;
        const origReplace = history.replaceState;

        function onRouteChange() {
            observeArticle(); // 每次路由变化重新监听正文
        }

        history.pushState = function(...args) {
            origPush.apply(this, args);
            onRouteChange();
        };
        history.replaceState = function(...args) {
            origReplace.apply(this, args);
            onRouteChange();
        };
        window.addEventListener('popstate', onRouteChange);

        // 初始执行一次
        onRouteChange();
    }

    // 页面加载完成后创建按钮
    window.addEventListener('load', () => {
        hookSPA();

        // Menu
        createButton(menuSelector, '68px', 'Nav');
        // List
        createButton(listSelector, '120px', 'Pane');
    });
})();
