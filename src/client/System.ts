// Obtain basic system data (OS, CPU name, model, total RAM etc.)

import os from "os";

export class System {
    private os: NodeJS.Platform;
    private cpuModel: os.CpuInfo[];

    constructor() {
        console.log("Retrieving data about the system...");
        this.getSystemData();
    }


    // Get current OS
    private getSystemData() {
        this.os = process.platform;
        console.log(`Current OS: ${this.os}`);

        // CPU model name and data about each logical core
        // todo: use this to retrieve constant data about each core frequency
        this.cpuModel = os.cpus();
        // console.log(`CPU info:`);
        for (const item of this.cpuModel) {
            // console.log(item.model.slice(0, 11), item.speed);
        }

        // RAM free and total memory in GB
        console.log(`${(os.freemem() / 1073741824).toFixed(2)}GB free of ${(os.totalmem() / 1073741824).toFixed(2)}GB`);




    }




}