// ==UserScript==
// @name         Pony Swapper
// @namespace    http://tampermonkey.net/
// @version      999.9999
// @updateURL    https://raw.githubusercontent.com/Nikowoo/Pony-Town-Swapper/refs/heads/main/main.js
// @downloadURL  https://raw.githubusercontent.com/Nikowoo/Pony-Town-Swapper/refs/heads/main/main.js
// @description  Quickly swap between saved ponies
// @author       Nikowoo
// @match        *://*.pony.town/*
// @icon         https://pony.town/favicon.ico
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(() => {
    'use strict';

    const isMobile = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent)
        || ('ontouchstart' in window && navigator.maxTouchPoints > 1);

    if (isMobile) {
        const MOBILE_SCRIPT_URL = 'https://raw.githubusercontent.com/Nikowoo/Pony-Town-Swapper/refs/heads/main/mobile.js';

        GM_xmlhttpRequest({
            method: 'GET',
            url: MOBILE_SCRIPT_URL,
            onload(res) {
                if (res.status === 200) {
                    (new Function(res.responseText))();
                } else {
                    console.error('[PonySwapper] Failed to load mobile script — HTTP', res.status);
                }
            },
            onerror(err) {
                console.error('[PonySwapper] Failed to fetch mobile script:', err);
            }
        });

        return;
    }

    let running = false;
    let interval = null;
    let lastPickedId = null;
    let observer = null;
    let swapDelay = 400;

    const STYLE_ID = 'tm-hide-swapper-style';

    function injectHideStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            body.tm-hide-swapper swap-box,
            body.tm-hide-swapper .top-menu-button,
            body.tm-hide-swapper swap-box * {
                opacity: 0 !important;
                pointer-events: none !important;
                visibility: hidden !important;
            }
        `;
        document.head.appendChild(style);
    }

    function hideSwapper() {
        document.body.classList.add('tm-hide-swapper');
    }

    function showSwapper() {
        document.body.classList.remove('tm-hide-swapper');
    }

    function getItems() {
        return Array.from(
            document.querySelectorAll('li[id^="pony-item-"] a[role="option"]')
        );
    }

    function pickNoRepeat(items) {
        if (!items.length) return null;
        if (items.length === 1) return items[0];
        let pick;
        let safety = 0;
        do {
            pick = items[(Math.random() * items.length) | 0];
            safety++;
        } while (pick.closest('li')?.id === lastPickedId && safety < 10);
        lastPickedId = pick.closest('li')?.id ?? null;
        return pick;
    }

    function openMenu() {
        document.querySelector('swap-box .dropdown-toggle button')?.click();
    }

    function swapOnce() {
        openMenu();
        requestAnimationFrame(() => {
            const items = getItems();
            const pick = pickNoRepeat(items);
            if (!pick) return;
            pick.click();
        });
    }

    function restartInterval() {
        if (!running) return;
        clearInterval(interval);
        interval = setInterval(swapOnce, swapDelay);
    }

    const SEARCH_SELECTOR = '.character-select-search';

    function removeSearchBlock() {
        const el = document.querySelector(SEARCH_SELECTOR);
        if (el) el.remove();
    }

    function startRemovingUI() {
        removeSearchBlock();
        observer = new MutationObserver(() => {
            removeSearchBlock();
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    function stopRemovingUI() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    }

    function start() {
        if (running) return;
        running = true;
        injectHideStyle();
        hideSwapper();
        startRemovingUI();
        interval = setInterval(swapOnce, swapDelay);
        console.log("Started @", swapDelay + "ms");
    }

    function stop() {
        running = false;
        clearInterval(interval);
        interval = null;
        stopRemovingUI();
        showSwapper();
        console.log("Stopped");
    }

    function setSpeedPrompt() {
        const input = prompt(`Enter swap speed (1–2000 ms):`, swapDelay);
        if (input === null) return;
        const value = Number(input);
        if (!Number.isInteger(value) || value < 1 || value > 2000) {
            alert("Invalid input. Enter a number between 1 and 2000.");
            return;
        }
        swapDelay = value;
        console.log("Speed set to:", swapDelay + "ms");
        restartInterval();
    }

    document.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement?.tagName;
        const typing = activeTag === "INPUT" || activeTag === "TEXTAREA";
        if (!typing && e.key === ',') {
            running ? stop() : start();
        }
        if (!typing && e.key === '.') {
            setSpeedPrompt();
        }
    });

})();
