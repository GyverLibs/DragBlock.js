export default class DragBlock {
    constructor(block, cb) {
        const call = (t, x = 0, y = 0, z = 0) => cb({ type: t, dx: x, dy: y, dz: z });
        const getxy = (e, i) => [e.touches[i].pageX, e.touches[i].pageY];

        if ("ontouchstart" in document.documentElement) {
            block.addEventListener("touchstart", (e) => {
                if (this.drag < 2) this.drag++;
            }, { passive: false });

            document.addEventListener("touchmove", (e) => {
                e.preventDefault();
                switch (this.drag) {
                    case 1: {
                        let xy = getxy(e, 0);
                        if (this.prev1) call('drag', xy[0] - this.prev1[0], xy[1] - this.prev1[1]);
                        this.prev1 = getxy(e, 0);
                    } break;

                    case 2: {
                        let xy0 = getxy(e, 0);
                        let xy1 = getxy(e, 1);
                        let px = (xy0[0] + xy1[0]) / 2;
                        let py = (xy0[1] + xy1[1]) / 2;
                        if (this.prevP) call('drag', px - this.prevP[0], py - this.prevP[1]);
                        this.prevP = [px, py];

                        if (this.prev2) {
                            let dx = Math.abs(xy1[0] - xy0[0]) - Math.abs(this.prev2[0] - this.prev1[0]);
                            call('zoom', 0, 0, dx);
                        }
                        this.prev1 = getxy(e, 0);
                        this.prev2 = getxy(e, 1);
                    } break;
                }
            }, { passive: false });

            document.addEventListener("touchend", (e) => {
                if (this.drag) {
                    this.drag--;
                    this.prev1 = this.prev2 = this.prevP = null;
                }
            });
        } else {
            block.addEventListener("mousedown", (e) => this.drag = 1);
            block.addEventListener("wheel", (e) => call('zoom', 0, 0, -e.deltaY / 100));
            document.addEventListener("mousemove", (e) => this.drag && call('drag', e.movementX, e.movementY));
            document.addEventListener("mouseup", (e) => this.drag = 0);
        }

        block.addEventListener("click", (e) => call('click'));
    }

    drag = 0;
    prev1 = null;
    prev2 = null;
    prevP = null;
}