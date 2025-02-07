export default function DragBlock(block, cb, clickTout = 300, clickZone = 5) {
    const touch = "ontouchstart" in document.documentElement;
    let pressf = 0;
    let tchs = [];
    let tout = null;
    let dxy = { x: 0, y: 0 };
    let hover = false;

    let xy0 = () => {
        return { x: 0, y: 0 }
    }
    let call = (t, o) => {
        cb({ type: t, touch: touch, move: xy0(), pos: xy0(), drag: dxy, pressed: (touch ? tchs.length >= 2 : pressf), ...o })
    }
    let XY = (x, y) => {
        if (block.offsetParent) {
            if (block.offsetParent.tagName.toUpperCase() === "BODY") {
                x -= block.offsetLeft;
                y -= block.offsetTop;
            } else {
                x -= block.offsetParent.offsetLeft;
                y -= block.offsetParent.offsetTop;
            }
        }
        return { x: Math.round(x), y: Math.round(y) };
    }
    let XYe = (e) => {
        return XY(e.pageX, e.pageY);
    }
    let restartClick = () => {
        dxy = xy0();
        if (tout) clearTimeout(tout);
        tout = setTimeout(() => tout = null, clickTout);
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
            f = (Math.abs(dxy.x) < clickZone && Math.abs(dxy.y) < clickZone);
        }
        dxy = xy0();
        return f;
    }

    //#region touch
    if (touch) {
        let findt = (e, id) => {
            for (let i in e.changedTouches) if (e.changedTouches[i].identifier == id) return gett(e, i);
            return null;
        }

        let gett = (e, n) => {
            let t = e.changedTouches[n];
            return { id: t.identifier, x: t.pageX, y: t.pageY }
        }
        let touchstart = (e) => {
            if (hover && e.target != block && !tchs.length) {
                hover = false;
                call('leave');
                document.removeEventListener("touchstart", touchstart);
                document.removeEventListener("touchmove", touchmove);
                document.removeEventListener("touchend", touchend);
                document.removeEventListener("touchcancel ", touchend);
            }
        }
        let touchmove = (e) => {
            if (!tchs.length) return;

            if (tchs.length == 1) {
                let pt = tchs[0];
                let t = findt(e, pt.id);
                if (!t) return;
                e.preventDefault();
                call('move', { move: { x: t.x - pt.x, y: t.y - pt.y }, pos: XY(t.x, t.y) });
                cancelClick();
            } else {
                let t = [0, 0], pt = [0, 0], f = 0;
                for (let i in t) {
                    pt[i] = tchs[i];
                    t[i] = findt(e, pt[i].id);
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
                    call('drag', { move: { x: drx, y: dry }, pos: XY(px, py) });

                    let dx = Math.abs(t[0].x - t[1].x);
                    let dy = Math.abs(t[0].y - t[1].y);
                    let dtx = Math.abs(pt[0].x - pt[1].x);
                    let dty = Math.abs(pt[0].y - pt[1].y);
                    call('zoom', { zoom: Math.hypot(dx, dy) - Math.hypot(dtx, dty), pos: XY(px, py) });
                }
            }

            for (let i in tchs) {
                let t = findt(e, tchs[i].id);
                if (t) tchs[i] = t;
            }
        }
        let touchend = (e) => {
            if (tchs.length) {
                let t = gett(e, 0);
                if (!t) return;
                let i = tchs.findIndex(x => t.id == x.id);
                if (~i) {
                    e.preventDefault();
                    tchs.splice(i, 1);
                    if (tchs.length == 0 && checkClick()) call('click', { pos: XY(t.x, t.y) });
                    if (tchs.length == 1) call('release', { pos: XY(t.x, t.y) });
                }
            }
        }

        block.addEventListener("touchstart", (e) => {
            e.preventDefault();
            let t = gett(e, 0);
            if (!t) return;

            let i = tchs.findIndex(x => t.id == x.id);
            if (~i) tchs.splice(i, 1);
            tchs.unshift(t);
            if (tchs.length == 1) {
                restartClick();
                if (!hover) {
                    hover = true;
                    document.addEventListener("touchstart", touchstart, { passive: false });
                    document.addEventListener("touchmove", touchmove, { passive: false });
                    document.addEventListener("touchend", touchend);
                    document.addEventListener("touchcancel ", touchend);
                    call('enter');
                }
            }
            if (tchs.length == 2) {
                call('press', { pos: XY(t.x, t.y) });
                cancelClick();
            };
        }, { passive: false });

        //#region mouse
    } else {
        let mousemove = (e) => {
            if (pressf) {
                e.preventDefault();
                dxy.x += e.movementX;
                dxy.y += e.movementY;
                call('drag', { move: { x: e.movementX, y: e.movementY }, pos: XYe(e) });
            }
        }
        let mouseup = (e) => {
            if (pressf) {
                e.preventDefault();
                pressf = 0;
                call('release', { pos: XYe(e) });
                if (checkClick()) call('click', { pos: XYe(e) });
                if (e.target !== block) remove();
            }
        }
        let remove = () => {
            document.removeEventListener("mousemove", mousemove);
            document.removeEventListener("mouseup", mouseup);
        }
        block.addEventListener("mouseenter", () => {
            call('enter');
            document.addEventListener("mousemove", mousemove);
            document.addEventListener("mouseup", mouseup);
        });
        block.addEventListener("mouseleave", () => {
            call('leave');
            if (!pressf) remove();
        });
        block.addEventListener("mousedown", (e) => {
            if (!pressf) {
                e.preventDefault();
                pressf = 1;
                restartClick();
                call('press', { pos: XYe(e) });
            }
        });
        block.addEventListener("mousemove", (e) => {
            if (!pressf) call('move', { move: { x: e.movementX, y: e.movementY }, pos: XYe(e) });
        });
        block.addEventListener("wheel", (e) => {
            e.preventDefault();
            call('zoom', { zoom: -e.deltaY / 100, pos: XYe(e) });
        });
    }
}