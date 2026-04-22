// ==UserScript==
// @name         Pony Toy Swapper
// @namespace    http://tampermonkey.net/
// @version      3.0
// @updateURL    https://raw.githubusercontent.com/Nikowoo/Pony-Town-Swapper/refs/heads/main/toyswapper.user.js
// @downloadURL  https://raw.githubusercontent.com/Nikowoo/Pony-Town-Swapper/refs/heads/main/toyswapper.user.js
// @description  Quickly swap between custom plushies randomly
// @author       Nikowoo
// @match        *://*.pony.town/*
// @icon         https://pony.town/favicon.ico
// @grant        none
// ==/UserScript==
//*.pony.town/*

(() => {
    'use strict';

    let running = false;
    let interval = null;
    let lastPickedIndex = null;
    let swapDelay = 400;

    const STYLE_ID = 'tm-hide-toyswapper-style';

    function injectHideStyle() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            body.tm-hide-toyswapper .settings-box,
            body.tm-hide-toyswapper .top-menu-button,
            body.tm-hide-toyswapper .settings-box *,
            body.tm-hide-toyswapper ngb-modal-window,
            body.tm-hide-toyswapper ngb-modal-window *,
            body.tm-hide-toyswapper ngb-modal-backdrop {
                opacity: 0 !important;
                pointer-events: none !important;
                visibility: hidden !important;
            }

            body.tm-hide-toyswapper ngb-modal-window,
            body.tm-hide-toyswapper ngb-modal-backdrop {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    function hideUI() {
        document.body.classList.add('tm-hide-toyswapper');
    }

    function showUI() {
        document.body.classList.remove('tm-hide-toyswapper');
    }

    function openSettingsMenu() {
        const settingsToggle = document.querySelector('.settings-box .dropdown-toggle button');
        if (settingsToggle) settingsToggle.click();
    }

    function clickSelectToy() {
        const buttons = Array.from(document.querySelectorAll('.settings-box-menu .dropdown-item'));
        const toyBtn = buttons.find(btn => btn.textContent.trim().toLowerCase().includes('select toy'));
        if (toyBtn) {
            toyBtn.click();
            return true;
        }
        return false;
    }

    function getPlushItems() {
        return Array.from(
            document.querySelectorAll('character-plush-list [role="option"][id^="pony-item-"]')
        );
    }

    function clickConfirm() {
        const buttons = Array.from(document.querySelectorAll('toys-modal .modal-footer button'));
        const confirm = buttons.find(btn => btn.textContent.trim().toLowerCase() === 'confirm');
        if (confirm) confirm.click();
    }

    function pickNoRepeat(items) {
        if (!items.length) return null;
        if (items.length === 1) return items[0];

        let pick;
        let safety = 0;

        do {
            pick = items[(Math.random() * items.length) | 0];
            safety++;
        } while (items.indexOf(pick) === lastPickedIndex && safety < 10);

        lastPickedIndex = items.indexOf(pick);
        return pick;
    }

    function swapOnce() {

        openSettingsMenu();

        requestAnimationFrame(() => {
            const opened = clickSelectToy();

            if (!opened) {
                console.warn('[ToySwapper] Could not find "Select toy" button.');
                return;
            }

            setTimeout(() => {
                const items = getPlushItems();

                if (!items.length) {
                    console.warn('[ToySwapper] No custom plushie items found in modal.');
                    return;
                }

                const pick = pickNoRepeat(items);
                if (pick) pick.click();

                setTimeout(() => {
                    clickConfirm();
                }, 80);

            }, 150);
        });
    }

    function restartInterval() {
        if (!running) return;
        clearInterval(interval);
        interval = setInterval(swapOnce, swapDelay);
    }

    function start() {
        if (running) return;
        running = true;
        injectHideStyle();
        hideUI();
        interval = setInterval(swapOnce, swapDelay);
        console.log('[ToySwapper] Started @', swapDelay + 'ms');
    }

    function stop() {
        running = false;
        clearInterval(interval);
        interval = null;
        showUI();
        console.log('[ToySwapper] Stopped');
    }

    function setSpeedPrompt() {
        const input = prompt('Enter swap speed (1–2000 ms):', swapDelay);
        if (input === null) return;

        const value = Number(input);
        if (!Number.isInteger(value) || value < 1 || value > 2000) {
            alert('Invalid input. Enter a number between 1 and 2000.');
            return;
        }

        swapDelay = value;
        console.log('[ToySwapper] Speed set to:', swapDelay + 'ms');
        restartInterval();
    }

    document.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement?.tagName;
        const typing = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

        if (!typing && e.key === '[') {
            running ? stop() : start();
        }

        if (!typing && e.key === ']') {
            setSpeedPrompt();
        }
    });

    console.log('[ToySwapper] Loaded — press [ to start/stop, ] to set speed');
})();
