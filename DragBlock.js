export default class DragBlock {
    constructor(block, cb) {
        const touch = "ontouchstart" in document.documentElement;
        const call = (t, x = 0, y = 0, z = 0) => cb({ type: t, dx: x, dy: y, dz: z, touch: touch });
        const findt = (e, id) => {
            for (let i in e.changedTouches) if (e.changedTouches[i].identifier == id) return gett(e, i);
            return null;
        }
        const gett = (e, n) => {
            let t = e.changedTouches[n];
            return { id: t.identifier, x: t.pageX, y: t.pageY }
        }

        if (touch) {
            block.addEventListener("touchstart", (e) => {
                e.preventDefault();
                let t = gett(e, 0);
                if (!t) return;
                if (!this.tchs.length) call('press');
                this.tchs.push(t);
            }, { passive: false });

            document.addEventListener("touchmove", (e) => {
                if (!this.tchs.length) return;

                if (this.tchs.length == 1) {
                    let pt = this.tchs[0];
                    let t = findt(e, pt.id);
                    if (!t) return;
                    e.preventDefault();
                    call('drag', t.x - pt.x, t.y - pt.y);
                } else {
                    let t = [0, 0], pt = [0, 0], f = 0;
                    for (let i in t) {
                        pt[i] = this.tchs[i];
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
                        call('drag', px - ptx, py - pty);

                        let dx = Math.abs(t[0].x - t[1].x);
                        let dy = Math.abs(t[0].y - t[1].y);
                        let dtx = Math.abs(pt[0].x - pt[1].x);
                        let dty = Math.abs(pt[0].y - pt[1].y);
                        let dz = Math.hypot(dx, dy) - Math.hypot(dtx, dty);
                        call('zoom', 0, 0, dz);
                    }
                }

                for (let i in this.tchs) {
                    let t = findt(e, this.tchs[i].id);
                    if (t) this.tchs[i] = t;
                }
            }, { passive: false });

            let cancel = (e) => {
                if (this.tchs.length) {
                    let t = gett(e, 0);
                    if (!t) return;
                    let i = this.tchs.findIndex(x => t.id == x.id);
                    if (~i) {
                        e.preventDefault();
                        this.tchs.splice(i, 1);
                        if (!this.tchs.length) call('release');
                    }
                }
            }
            document.addEventListener("touchend", (e) => cancel(e));
            document.addEventListener("touchcancel ", (e) => cancel(e));

        } else {
            block.addEventListener("mousedown", (e) => {
                this.drag = 1;
                call('press');
            });
            block.addEventListener("wheel", (e) => {
                call('zoom', 0, 0, -e.deltaY / 100);
            });
            document.addEventListener("mousemove", (e) => {
                if (this.drag) {
                    call('drag', e.movementX, e.movementY);
                }
            });
            document.addEventListener("mouseup", (e) => {
                if (this.drag) {
                    this.drag = 0;
                    call('release');
                }
            });
        }
    }

    drag = 0;
    tchs = [];
}