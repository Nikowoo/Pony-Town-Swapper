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
        updateToggleBtn();
    }

    function stop() {
        if (!running) return;
        running = false;
        clearInterval(interval);
        interval = null;
        stopRemovingUI();
        showSwapper();
        updateToggleBtn();
    }

    let toggleBtn;

    function updateToggleBtn() {
        if (!toggleBtn) return;
        toggleBtn.textContent = running ? 'Stop' : 'Start';
    }

    function promptSpeed() {
        const input = prompt('Swap interval in ms (50–2000):', swapDelay);
        if (input === null) return;
        const val = parseInt(input, 10);
        if (isNaN(val) || val < 50 || val > 2000) {
            alert('Please enter a number between 50 and 2000.');
            return;
        }
        swapDelay = val;
        restartInterval();
    }

    function buildButtons() {
        const wrap = document.createElement('div');
        Object.assign(wrap.style, {
            position: 'fixed',
            top: '12px',
            left: '12px',
            display: 'flex',
            gap: '6px',
            zIndex: '999998',
        });

        function makeBtn(text, onClick) {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.addEventListener('click', onClick);
            return btn;
        }

        toggleBtn = makeBtn('Start', () => running ? stop() : start());
        const speedBtn = makeBtn('Speed', promptSpeed);

        wrap.append(toggleBtn, speedBtn);
        document.body.appendChild(wrap);
    }

    buildButtons();

})();
