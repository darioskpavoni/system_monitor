// Initialize system data (OS, CPU name, model, total RAM etc.)

import os from "os";
import osUtils from "node-os-utils";
import { execSync } from "child_process";
import { ICPUUsage, ICPUData, IPartitionUsage, IRAMUsage, IProcess } from "./ISystemData";
import { TIMER } from "./main";
import { Logger } from "./Logger";
import { Utils } from "./Utils";
export class System {
    private static instance: System;

    public os: NodeJS.Platform;
    public hostname: string;
    private ramTimer: NodeJS.Timer;
    private cpuTimer: NodeJS.Timer;
    private partitionTimer: NodeJS.Timer;
    private processesTimer: NodeJS.Timer;

    public initializedAllData = false;

    public cpuData: ICPUData = {
        producer: "",
        fullName: "",
        frequency: 0,
        physicalCores: 0,
        logicalCores: 0,
    };

    public cpuUsage: ICPUUsage = { values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], timestamps: ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0"] };

    public ramData: IRAMUsage = {
        free: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        total: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        used: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        freePercentage: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        usedPercentage: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        timestamps: ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0"]
    };

    public partitions: IPartitionUsage[] = [];

    public processes: IProcess[] = [];

    private constructor() {
        this.initialize();
    }

    // this class has to be a singleton
    public static getInstance(): System {
        if (!System.instance) {
            System.instance = new System();
        }
        return System.instance;
    }


    private initialize() {
        this.initializeSystemData();
        this.getDataFlow();
    }

    // Get initial data about CPU
    private initializeSystemData() {

        // check if this is an extra instance for testing
        const extraInstance = process.argv.indexOf("-extraInstance") !== -1 ? true : false;

        this.hostname = extraInstance ? "EXTRA_INSTANCE" : os.hostname();
        this.os = process.platform;

        console.log(`Hostname: ${this.hostname}`);
        console.log(`OS: ${this.os}`);

        this.initializeCPUData();
    }

    private getDataFlow() {
        this.getCPUData(TIMER);
        this.getRAMData(TIMER);
        this.getDiskData(TIMER * 5);
        this.getProcesses(TIMER * 5);
    }


    private updateArray(array: number[], value: number) {
        if (array.length >= 10) {
            array.shift();
        }
        array.push(value);
    }

    private initializeCPUData() {
        // CPU model name and data about each logical core
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

        // console.log(this.cpuData);
    }

    private getCPUData(timer?: number) {
        const _getCPUData = () => {
            const cpu = osUtils.cpu;
            cpu.usage().then((percentage) => {
                if (this.cpuUsage.values.length >= 10) {
                    this.cpuUsage.values.shift();
                }
                this.cpuUsage.values.push(percentage);

                // also get a timestamp for the each value (for the label in the chart)
                const timestamp = Utils.getTimestamp();
                if (this.cpuUsage.timestamps.length >= 10) {
                    this.cpuUsage.timestamps.shift();
                }
                this.cpuUsage.timestamps.push(timestamp);


                Logger.log(`[CPU] ${this.cpuUsage.values[this.cpuUsage.values.length - 1]}%`);
            });
        };

        this.cpuTimer = setTimeout(function repeat() {
            _getCPUData();
            setTimeout(repeat, timer);
        }, timer);
    }

    private getRAMData(timer?: number) {
        const _getRAMData = () => {
            // RAM values in GB
            const ramDataFree = parseFloat(
                (os.freemem() / 1073741824).toFixed(2)
            );
            const ramDataTotal = parseFloat(
                (os.totalmem() / 1073741824).toFixed()
            );
            const ramDataUsed = parseFloat(
                (ramDataTotal - ramDataFree).toFixed(2)
            );

            // RAM values in %
            const ramDataFreePercentage = parseFloat(
                ((ramDataFree * 100) / ramDataTotal).toFixed(2)
            );
            const ramDataUsedPercentage = parseFloat(
                (100 - ramDataFreePercentage).toFixed(2)
            );

            // push values to their arrays
            this.updateArray(this.ramData.free, ramDataFree);
            this.updateArray(this.ramData.total, ramDataTotal);
            this.updateArray(this.ramData.used, ramDataUsed);
            this.updateArray(this.ramData.freePercentage, ramDataFreePercentage);
            this.updateArray(this.ramData.usedPercentage, ramDataUsedPercentage);

            // also get a timestamp for the each value (for the label in the chart)
            const timestamp = Utils.getTimestamp();
            if (this.ramData.timestamps.length >= 10) {
                this.ramData.timestamps.shift();
            }
            this.ramData.timestamps.push(timestamp);

            Logger.log(
                `[RAM] ${this.ramData.used}GB used of ${this.ramData.total}GB, ${this.ramData.free}GB free | ${this.ramData.usedPercentage}% used, ${this.ramData.freePercentage}% free`
            );

        };

        this.ramTimer = setTimeout(function repeat() {
            _getRAMData();
            setTimeout(repeat, timer);
        }, timer);
    }

    private getDiskData(timer?: number) {
        const _getPartitionData = () => {
            if (this.os === "win32") {
                // -h → Print sizes in human readable format (in powers of 1024)
                const _diskData = execSync("df -h").toString().trim();

                let _diskPartitionsLines = _diskData.split(/\r?\n/);
                let _diskPartitions = [];
                for (const item of _diskPartitionsLines) {
                    if (_diskPartitionsLines.indexOf(item) === 0) {
                        // skip first row (table header)
                        continue;
                    }

                    // split items by spaces
                    let diskPartItems = item.split(/\s\s+/);
                    _diskPartitions.push(diskPartItems);
                }

                for (const item of _diskPartitions) {
                    // matching string until first slash and assuming there is always a match (!)
                    let partitionLabel = item[0].match(/^[^\/]*/)![0];
                    let partitionTotal = parseFloat(item[1].replace("G", ""));
                    let partitionUsed = parseFloat(item[2].replace("G", ""));
                    let partitionFree = parseFloat(item[3].replace("G", ""));
                    let partitionUsedPercentage = parseFloat(
                        parseFloat(item[4].replace("%", "")).toFixed(2)
                    ); // remove %;
                    let partitionFreePercentage = parseFloat(
                        (100 - partitionUsedPercentage).toFixed(2)
                    );

                    // partition filtering (keep only partitions with letter labels, ex. C:\)
                    if (partitionLabel.indexOf(`:`) === -1) {
                        continue;
                    }

                    // processing of data
                    let obj = {
                        label: partitionLabel,
                        free: partitionFree,
                        total: partitionTotal,
                        used: partitionUsed,
                        freePercentage: partitionFreePercentage,
                        usedPercentage: partitionUsedPercentage,
                    };

                    // Update partition obj if already existing, else push it
                    let partitionMatch = false;
                    for (const i in this.partitions) {
                        if (this.partitions[i].label === obj.label) {
                            partitionMatch = true;
                            this.partitions[i] = obj;
                            break;
                        }
                    }
                    if (!partitionMatch) {
                        this.partitions.push(obj);
                    }
                }
                Logger.log(
                    `[DISK] Detected partitions: ${this.partitions.length}`
                );

                this.initializedAllData = true;
            }
        };
        this.partitionTimer = setTimeout(function repeat() {
            _getPartitionData();
            setTimeout(repeat, timer);
        }, timer);
    }

    private getProcesses(timer?: number) {
        if (this.os === "win32") {
            this.getWinProcesses(timer);
        }
        // future implementation of linux process list
    }

    private getWinProcesses(timer?: number) {
        const _getProcesses = () => {

            this.processes = [];

            // run tasklist (Win)
            const _processes = execSync("tasklist").toString().trim();

            // split by newline
            let _procLines = _processes.split(/\r?\n/);
            // remove first two lines, which have no useful data
            _procLines.splice(0, 2);

            // remove all spaces => array of substrings
            for (let line of _procLines) {

                // skip if name does not contain .exe 
                // (there are few processes with no .exe name, which appear to be used by the system, so it's better not to take them)
                if (line[0].indexOf(".exe") !== -1) {
                    return;
                }

                // array of lines resulting from the command
                let array = line.trim().split(/\s+/);

                // parsing where needed
                const name = array[0];
                const pid = parseInt(array[1]);
                // get mem usage, remove . from the value, convert it to MB, only get 2 digits after comma
                let memUsage = parseFloat((parseInt(array[array.length - 2].replace(".", "")) / 1024).toFixed(2));

                const process: IProcess = {
                    name,
                    pid,
                    memUsage
                }

                this.processes.push(process);
            }
        };

        this.processesTimer = setTimeout(function repeat() {
            _getProcesses();
            setTimeout(repeat, timer);
        }, timer);
    }

}
