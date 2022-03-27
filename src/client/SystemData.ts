// Obtain constant flow of data about CPU, RAM and DISK

import { System } from "./System";

export class SystemData extends System {
    private getData_ID: any;
    private TIMER_GETDATA = 1000;

    constructor() {
        super();
        console.log("System class constructor has been called...");
        this.getCPU();
    }

    private getCPU() {
        /* this.getData_ID = setInterval(() => {
            console.log(os.cpus());
        }, this.TIMER_GETDATA); */
    }
}
