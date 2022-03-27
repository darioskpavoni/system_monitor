// Obtain basic system data (OS, CPU name, model, total RAM etc.)

import os from "os";
import { ICPUData } from "./ISystemData";
import { execSync } from "child_process";
export class System {
    private os: NodeJS.Platform;
    private cpuData: ICPUData = {
        producer: "",
        fullName: "",
        frequency: 0,
        physicalCores: 0,
        logicalCores: 0,
    };

    constructor() {
        console.log("Retrieving data about the system...");
        this.getSystemData();
    }

    // Get current OS
    private getSystemData() {
        this.os = process.platform;
        console.log(`Current OS: ${this.os}`);

        this.getCPUData();

        // RAM free and total memory in GB
        console.log(
            `${(os.freemem() / 1073741824).toFixed(2)}GB free of ${(
                os.totalmem() / 1073741824
            ).toFixed(2)}GB`
        );
    }

    private getCPUData() {
        // CPU model name and data about each logical core
        // todo: use this to retrieve constant data about each core frequency
        const cpuModel = os.cpus();

        // CPU Producer
        // todo: implement better way of extracting CPU make (regex?)
        const isIntel = cpuModel[0].model.indexOf("Intel") !== -1;
        const isAMD = cpuModel[0].model.indexOf("AMD") !== -1;
        if (isIntel) {
            this.cpuData.producer = "Intel";
        } else if (isAMD) {
            this.cpuData.producer = "AMD";
        }

        // CPU Full name
        this.cpuData.fullName = cpuModel[0].model.trim();

        // CPU Frequency (in GHz)
        this.cpuData.frequency = cpuModel[0].speed / 1000;

        // CPU Logical cores
        this.cpuData.logicalCores = cpuModel.length;

        // CPU Physical cores
        /* run command which returns physical cores, output is a 2-line text
        number of cores is on 2nd line, so split string by new line and select second element */
        if (os.platform() === "win32") {
            const physicalCores: string = execSync("WMIC CPU Get NumberOfCores")
                .toString()
                .trim()
                .split(/\r?\n/)[1];
            this.cpuData.physicalCores = parseInt(physicalCores);
        } else if (os.platform() === "linux") {
            // implement linux
        }

        console.log(this.cpuData);
    }
}
