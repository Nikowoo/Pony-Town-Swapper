// ==UserScript==
// @name         Pony Swapper Mobile
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  mobile version
// @author       Nikowoo
// @match        *://*.pony.town/*
// @icon         https://pony.town/favicon.ico
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    let running = false;
    let interval = null;
    let lastPickedId = null;
    let observer = null;
    let swapDelay = 150;
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

    function hideSwapper() { document.body.classList.add('tm-hide-swapper'); }
    function showSwapper() { document.body.classList.remove('tm-hide-swapper'); }

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

    function removeSearchBlock() {
        document.querySelector('.character-select-search')?.remove();
    }

    function startRemovingUI() {
        removeSearchBlock();
        observer = new MutationObserver(removeSearchBlock);
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    function stopRemovingUI() {
        observer?.disconnect();
        observer = null;
    }
    function start() {
        if (running) return;
        running = true;
        injectHideStyle();
        hideSwapper();
        startRemovingUI();
        interval = setInterval(swapOnce, swapDelay);
        showToast('Swapper started');
    }

    function stop() {
        if (!running) return;
        running = false;
        clearInterval(interval);
        interval = null;
        stopRemovingUI();
        showSwapper();
        showToast('Swapper stopped');
    }
    let toastTimeout = null;

    function showToast(message) {
        let toast = document.getElementById('tm-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'tm-toast';
            Object.assign(toast.style, {
                position: 'fixed',
                bottom: '90px',
                left: '50%',
                transform: 'translateX(-50%) translateY(20px)',
                background: 'rgba(15, 10, 30, 0.92)',
                color: '#e8d5ff',
                fontFamily: '"SF Pro Rounded", "Nunito", system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: '600',
                letterSpacing: '0.02em',
                padding: '10px 20px',
                borderRadius: '50px',
                border: '1px solid rgba(180, 120, 255, 0.35)',
                boxShadow: '0 4px 24px rgba(140, 60, 255, 0.25)',
                zIndex: '999999',
                opacity: '0',
                transition: 'opacity 0.2s ease, transform 0.2s ease',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
            });
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
        }, 1800);
    }
    function buildModal() {
        if (document.getElementById('tm-modal-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'tm-modal-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            inset: '0',
            background: 'rgba(5, 0, 18, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: '1000000',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '0 0 24px',
            opacity: '0',
            transition: 'opacity 0.25s ease',
        });
        const card = document.createElement('div');
        Object.assign(card.style, {
            background: 'linear-gradient(160deg, #12082a 0%, #1a0d35 100%)',
            border: '1px solid rgba(180, 120, 255, 0.2)',
            borderRadius: '24px',
            padding: '28px 24px 20px',
            width: 'min(360px, calc(100vw - 32px))',
            boxShadow: '0 -4px 60px rgba(120, 40, 255, 0.2), 0 2px 40px rgba(0,0,0,0.6)',
            transform: 'translateY(30px)',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            fontFamily: '"SF Pro Rounded", "Nunito", system-ui, sans-serif',
            color: '#e8d5ff',
        });

        const handle = document.createElement('div');
        Object.assign(handle.style, {
            width: '40px',
            height: '4px',
            borderRadius: '2px',
            background: 'rgba(180,120,255,0.3)',
            margin: '0 auto 20px',
        });

        // Title
        const title = document.createElement('div');
        title.textContent = 'Pony Swapper';
        Object.assign(title.style, {
            fontSize: '20px',
            fontWeight: '700',
            marginBottom: '6px',
            letterSpacing: '-0.01em',
        });
        const subtitle = document.createElement('div');
        subtitle.id = 'tm-modal-status';
        Object.assign(subtitle.style, {
            fontSize: '13px',
            color: 'rgba(200,170,255,0.6)',
            marginBottom: '24px',
        });

        function refreshStatus() {
            subtitle.textContent = running
                ? `Running · swapping every ${swapDelay}ms`
                : `Stopped · swap speed ${swapDelay}ms`;
            subtitle.style.color = running ? 'rgba(140,255,170,0.75)' : 'rgba(200,170,255,0.5)';
        }
        refreshStatus();

        // Speed label row
        const speedRow = document.createElement('div');
        Object.assign(speedRow.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
        });

        const speedLabel = document.createElement('label');
        speedLabel.textContent = 'Swap speed';
        Object.assign(speedLabel.style, {
            fontSize: '14px',
            fontWeight: '600',
            color: 'rgba(220,195,255,0.9)',
        });

        const speedValue = document.createElement('span');
        speedValue.id = 'tm-speed-value';
        speedValue.textContent = swapDelay + ' ms';
        Object.assign(speedValue.style, {
            fontSize: '14px',
            fontWeight: '700',
            color: '#c87dff',
            minWidth: '60px',
            textAlign: 'right',
        });

        speedRow.append(speedLabel, speedValue);
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '50';
        slider.max = '2000';
        slider.step = '50';
        slider.value = swapDelay;
        Object.assign(slider.style, {
            width: '100%',
            marginBottom: '20px',
            accentColor: '#9b4fff',
            cursor: 'pointer',
        });

        slider.addEventListener('input', () => {
            swapDelay = Number(slider.value);
            speedValue.textContent = swapDelay + ' ms';
            refreshStatus();
            restartInterval();
        });
        const btnRow = document.createElement('div');
        Object.assign(btnRow.style, {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '12px',
        });

        function makeBtn(label, bg, action) {
            const btn = document.createElement('button');
            btn.textContent = label;
            Object.assign(btn.style, {
                background: bg,
                border: 'none',
                borderRadius: '14px',
                padding: '14px 10px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '700',
                fontFamily: 'inherit',
                cursor: 'pointer',
                letterSpacing: '0.01em',
                boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                transition: 'filter 0.15s ease, transform 0.1s ease',
                WebkitTapHighlightColor: 'transparent',
            });
            btn.addEventListener('touchstart', () => {
                btn.style.filter = 'brightness(1.2)';
                btn.style.transform = 'scale(0.97)';
            }, { passive: true });
            btn.addEventListener('touchend', () => {
                btn.style.filter = '';
                btn.style.transform = '';
                action();
            }, { passive: true });
            btn.addEventListener('click', action);
            return btn;
        }

        const startBtn = makeBtn('Start', 'linear-gradient(135deg, #6b23c9, #9b4fff)', () => {
            start();
            refreshStatus();
        });

        const stopBtn = makeBtn('Stop', 'linear-gradient(135deg, #3a1060, #5a1f8a)', () => {
            stop();
            refreshStatus();
        });

        btnRow.append(startBtn, stopBtn);
        const closeBtn = makeBtn('✕ Close', 'rgba(255,255,255,0.07)', closeModal);
        Object.assign(closeBtn.style, {
            gridColumn: '1 / -1',
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(210,180,255,0.7)',
            padding: '12px',
        });

        card.append(handle, title, subtitle, speedRow, slider, btnRow, closeBtn);
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
        });

    
        overlay.addEventListener('touchend', (e) => {
            if (e.target === overlay) closeModal();
        }, { passive: true });
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    function closeModal() {
        const overlay = document.getElementById('tm-modal-overlay');
        if (!overlay) return;
        overlay.style.opacity = '0';
        const card = overlay.firstElementChild;
        if (card) card.style.transform = 'translateY(30px)';
        setTimeout(() => overlay.remove(), 280);
    }

    function openModal() {
        if (document.getElementById('tm-modal-overlay')) {
            closeModal();
        } else {
            buildModal();
        }
    }

    const GESTURE_WINDOW = 300; //  touches must always land within this window
    const TAP_MOVE_THRESHOLD = 15;

    let touchStartTime = 0;
    let touchStartPositions = [];

    document.addEventListener('touchstart', (e) => {
        touchStartTime = Date.now();
        touchStartPositions = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        const elapsed = Date.now() - touchStartTime;
        const count = e.changedTouches.length + e.touches.length; // total fingers

        // Verify it was a short tap
        if (elapsed > GESTURE_WINDOW) return;

  
        const moved = Array.from(e.changedTouches).some((t, i) => {
            const start = touchStartPositions[i];
            if (!start) return false;
            const dx = Math.abs(t.clientX - start.x);
            const dy = Math.abs(t.clientY - start.y);
            return dx > TAP_MOVE_THRESHOLD || dy > TAP_MOVE_THRESHOLD;
        });
        if (moved) return;

        const fingers = touchStartPositions.length;

        if (fingers === 3) {
            e.preventDefault?.();
            running ? stop() : start();
        } else if (fingers === 4) {
            e.preventDefault?.();
            openModal();
        }
    }, { passive: true });
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&display=swap';
    document.head.appendChild(link);

})();
