// Initialize system data (OS, CPU name, model, total RAM etc.)

import os from "os";
import { ICPUData, IRAMData } from "./ISystemData";
import { TIMER } from "./SystemData";
import { execSync } from "child_process";
export class System {
    private os: NodeJS.Platform;
    private ramTimer: NodeJS.Timer;
    private cpuData: ICPUData = {
        producer: "",
        fullName: "",
        frequency: 0,
        physicalCores: 0,
        logicalCores: 0,
    };
    private ramData: IRAMData = {
        free: 0,
        total: 0,
        used: 0,
        freePercentage: 0,
        usedPercentage: 0,
    };

    constructor() {
        this.initialize();
    }

    private initialize() {
        this.initializeSystemData();
        this.getDataFlow();
    }

    private getDataFlow() {
        this.getRAMData(TIMER);
    }

    // Get current OS
    private initializeSystemData() {
        this.os = process.platform;
        console.log(`Current OS: ${this.os}`);

        this.initializeCPUData();
    }

    private getRAMData(interval?: number) {
        const _getRAMData = () => {
            // RAM values in GB
            this.ramData.free = parseFloat(
                (os.freemem() / 1073741824).toFixed(2)
            );
            this.ramData.total = parseFloat(
                (os.totalmem() / 1073741824).toFixed()
            );
            this.ramData.used = this.ramData.total - this.ramData.free;

            // RAM values in %
            this.ramData.freePercentage = parseFloat(
                ((this.ramData.free * 100) / this.ramData.total).toFixed(2)
            );
            this.ramData.usedPercentage = parseFloat(
                (100 - this.ramData.freePercentage).toFixed(2)
            );

            console.log(
                `[RAM] ${this.ramData.used}GB used of ${this.ramData.total}GB, ${this.ramData.free}GB free | ${this.ramData.usedPercentage}% used, ${this.ramData.freePercentage}% free`
            );
        };

        this.ramTimer = setTimeout(function repeat() {
            _getRAMData();
            setTimeout(repeat, interval);
        }, interval);
    }

    private initializeCPUData() {
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
