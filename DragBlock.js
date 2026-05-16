export default function DragBlock(block, cb, params = {}) {
    params = {
        context: window,
        clickTout: 300,
        clickZone: 5,
        menu: false,
        menuTout: 600,
        ...params
    };

    //#region data
    const touch = "ontouchstart" in params.context.document.documentElement;
    const passiveFalse = { passive: false };
    let xy0 = () => ({ x: 0, y: 0 });
    let unsub = () => { };
    let tout = null;
    let menuTout = null;
    let tchs = [];
    let dxy = xy0();
    let tdxy = xy0();
    let hover = false;
    let pressf = false;

    let on = (target, type, fn, opts) => target.addEventListener(type, fn, opts);
    let off = (target, type, fn, opts) => target.removeEventListener(type, fn, opts);
    let onDoc = (type, fn, opts) => on(params.context.document, type, fn, opts);
    let offDoc = (type, fn, opts) => off(params.context.document, type, fn, opts);

    let call = (type, o) => {
        cb({ type, block, touch, width: block.clientWidth, height: block.clientHeight, move: xy0(), pos: xy0(), drag: { x: dxy.x, y: dxy.y }, pressed: (touch ? tchs.length >= 2 : pressf), button: null, ...o })
    }
    let XY = (x, y) => {
        const r = block.getBoundingClientRect();
        return { x: Math.round(x - r.left), y: Math.round(y - r.top - params.context.document.documentElement.scrollTop) };
    }
    let XYe = (e) => {
        return XY(e.pageX, e.pageY);
    }
    let restartClick = () => {
        dxy = xy0();
        tdxy = xy0();
        if (tout) clearTimeout(tout);
        tout = setTimeout(() => tout = null, params.clickTout);
    }
    let cancelClick = () => {
        if (tout) {
            clearTimeout(tout);
            tout = null;
        }
    }
    let checkClick = () => {
        let f = 0;
        if (tout) {
            cancelClick();
            f = (Math.abs(dxy.x) < params.clickZone && Math.abs(dxy.y) < params.clickZone);
        }
        dxy = xy0();
        tdxy = xy0();
        return f;
    }

    //#region touch
    if (touch) {
        const none = 'none';
        block.style.userSelect = none;
        block.style.touchAction = none;
        block.style.webkitUserSelect = none;
        block.style.overscrollBehavior = none;
        block.style.webkitTouchCallout = none;

        const touchend = 'touchend';
        const touchmove = 'touchmove';
        const touchstart = 'touchstart';
        const touchcancel = 'touchcancel';

        let getTch = (e, n) => {
            let t = e.changedTouches[n];
            return { id: t.identifier, x: t.pageX, y: t.pageY };
        }
        let findTch = (e, id) => {
            for (let i in e.changedTouches) if (e.changedTouches[i].identifier == id) return getTch(e, i);
            return null;
        }

        // menu
        let cancelMenu = () => {
            if (menuTout) {
                clearTimeout(menuTout);
                menuTout = null;
            }
        }
        let startMenu = (e, pos) => {
            if (!params.menu) return;

            cancelMenu();

            menuTout = setTimeout(() => {
                menuTout = null;
                cancelClick();
                call('menu', { e, pos });
            }, params.menuTout);
        }

        // doc
        let touchStartDoc = (e) => {
            if (hover && e.target != block && !tchs.length) {
                hover = false;
                call('leave', { e });
                remDoc();
            }
        }
        let touchMoveDoc = (e) => {
            if (!tchs.length) return;

            if (tchs.length == 1) {
                let pt = tchs[0];
                let t = findTch(e, pt.id);
                if (!t) return;
                e.preventDefault();
                let dx = t.x - pt.x;
                let dy = t.y - pt.y;
                if (Math.abs(tdxy.x + dx) > params.clickZone || Math.abs(tdxy.y + dy) > params.clickZone) {
                    cancelMenu();
                }

                tdxy.x += dx;
                tdxy.y += dy;
                call('move', { e, move: { x: dx, y: dy }, pos: XY(t.x, t.y) });
                call('tdrag', { e, move: { x: dx, y: dy }, drag: tdxy, pos: XY(t.x, t.y) });
                cancelClick();
            } else {
                let t = [0, 0], pt = [0, 0], f = 0;
                for (let i = 0; i < 2; i++) {
                    pt[i] = tchs[i];
                    t[i] = findTch(e, pt[i].id);
                    if (t[i]) f = 1;
                    else t[i] = pt[i];
                }
                if (f) {
                    e.preventDefault();

                    let px = (t[0].x + t[1].x) / 2;
                    let py = (t[0].y + t[1].y) / 2;
                    let ptx = (pt[0].x + pt[1].x) / 2;
                    let pty = (pt[0].y + pt[1].y) / 2;
                    let drx = px - ptx;
                    let dry = py - pty;
                    dxy.x += drx;
                    dxy.y += dry;
                    call('drag', { e, move: { x: drx, y: dry }, pos: XY(px, py) });

                    let dx = Math.abs(t[0].x - t[1].x);
                    let dy = Math.abs(t[0].y - t[1].y);
                    let dtx = Math.abs(pt[0].x - pt[1].x);
                    let dty = Math.abs(pt[0].y - pt[1].y);
                    call('zoom', { e, zoom: Math.hypot(dx, dy) - Math.hypot(dtx, dty), pos: XY(px, py) });
                }
            }

            for (let i in tchs) {
                let t = findTch(e, tchs[i].id);
                if (t) tchs[i] = t;
            }
        }
        let touchEndDoc = (e) => {
            cancelMenu();
            if (tchs.length) {
                let t = getTch(e, 0);
                if (!t) return;
                let i = tchs.findIndex(x => t.id == x.id);
                if (~i) {
                    e.preventDefault();
                    tchs.splice(i, 1);
                    if (!tchs.length) {
                        call('trelease', { e, pos: XY(t.x, t.y) });
                        if (checkClick()) call('click', { e, pos: XY(t.x, t.y) });
                    }
                    if (tchs.length == 1) call('release', { e, pos: XY(t.x, t.y) });
                }
            }
        }

        // block
        let touchStartBlock = (e) => {
            e.preventDefault();
            let t = getTch(e, 0);
            if (!t) return;

            let i = tchs.findIndex(x => t.id == x.id);
            if (~i) tchs.splice(i, 1);
            tchs.unshift(t);
            if (tchs.length == 1) {
                restartClick();
                startMenu(e, XY(t.x, t.y));
                if (!hover) {
                    hover = true;
                    addDoc();
                    call('enter', { e, pos: XY(t.x, t.y) });
                }
                call('tpress', { e, pos: XY(t.x, t.y) });
            }
            if (tchs.length == 2) {
                cancelMenu();
                call('press', { e, pos: XY(t.x, t.y) });
                cancelClick();
            };
        }
        on(block, touchstart, touchStartBlock, passiveFalse);

        //#region touch events
        let added = false;
        let addDoc = () => {
            if (added) return;
            added = true;
            onDoc(touchstart, touchStartDoc, passiveFalse);
            onDoc(touchmove, touchMoveDoc, passiveFalse);
            onDoc(touchend, touchEndDoc);
            onDoc(touchcancel, touchEndDoc);
        }
        let remDoc = () => {
            if (!added) return;
            added = false;
            offDoc(touchstart, touchStartDoc, passiveFalse);
            offDoc(touchmove, touchMoveDoc, passiveFalse);
            offDoc(touchend, touchEndDoc);
            offDoc(touchcancel, touchEndDoc);
        }
        unsub = () => {
            tchs = [];
            remDoc();
            cancelMenu();
            cancelClick();
            off(block, touchstart, touchStartBlock, passiveFalse);
        }

        //#region mouse
    } else {
        const wheel = 'wheel';
        const mouseup = 'mouseup';
        const mousemove = 'mousemove';
        const mousedown = 'mousedown';
        const mouseenter = 'mouseenter';
        const mouseleave = 'mouseleave';
        const contextmenu = 'contextmenu';

        let button = null;

        // doc
        let mouseMoveDoc = (e) => {
            if (pressf) {
                e.preventDefault();
                dxy.x += e.movementX;
                dxy.y += e.movementY;
                call('drag', { e, move: { x: e.movementX, y: e.movementY }, pos: XYe(e), button });
            }
        }
        let mouseUpDoc = (e) => {
            if (pressf) {
                e.preventDefault();
                pressf = false;
                call('release', { e, pos: XYe(e) });
                if (checkClick()) call('click', { e, pos: XYe(e), button });
                if (e.target !== block) remDoc();
            }
            button = null;
        }

        // block
        let onContextMenu = e => {
            e.preventDefault();
            call('menu', { e, pos: XYe(e) });
        }
        let mouseEnterBlock = (e) => {
            call('enter', { e, pos: XYe(e) });
            addDoc();
        }
        let mouseLeaveBlock = (e) => {
            call('leave', { e, pos: XYe(e) });
            if (!pressf) remDoc();
        }
        let mouseDownBlock = (e) => {
            button = e.button;
            if (!pressf) {
                addDoc();
                e.preventDefault();
                pressf = true;
                restartClick();
                call('press', { e, pos: XYe(e), button });
            }
        }
        let mouseMoveBlock = (e) => {
            if (!pressf) call('move', { e, move: { x: e.movementX, y: e.movementY }, pos: XYe(e) });
        }
        let mouseWheelBlock = (e) => {
            e.preventDefault();
            call('zoom', { e, zoom: -e.deltaY / 100, pos: XYe(e) });
        }

        on(block, mousedown, mouseDownBlock);
        on(block, mousemove, mouseMoveBlock);
        on(block, mouseenter, mouseEnterBlock);
        on(block, mouseleave, mouseLeaveBlock);
        on(block, wheel, mouseWheelBlock, passiveFalse);
        if (params.menu) on(block, contextmenu, onContextMenu);

        //#region mouse events
        let added = false;
        let addDoc = () => {
            if (added) return;
            added = true;
            onDoc(mouseup, mouseUpDoc);
            onDoc(mousemove, mouseMoveDoc);
        }
        let remDoc = () => {
            if (!added) return;
            added = false;
            offDoc(mouseup, mouseUpDoc);
            offDoc(mousemove, mouseMoveDoc);
        }
        unsub = () => {
            remDoc();
            cancelClick();
            off(block, mousedown, mouseDownBlock);
            off(block, mousemove, mouseMoveBlock);
            off(block, mouseenter, mouseEnterBlock);
            off(block, mouseleave, mouseLeaveBlock);
            off(block, wheel, mouseWheelBlock, passiveFalse);
            if (params.menu) off(block, contextmenu, onContextMenu);
        }
    }

    return unsub;
}