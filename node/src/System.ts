// Initialize system data (OS, CPU name, model, total RAM etc.)

import os from "os";
import osUtils from "node-os-utils";
import { ICPUUsage, ICPUData, IPartitionData, IRAMData } from "./ISystemData";
import { TIMER } from "./main";
import { execSync } from "child_process";
import { Logger } from "./Logger";
import { Utils } from "./Utils";
export class System {
    private static instance: System;

    public os: NodeJS.Platform;
    public hostname: string;
    private ramTimer: NodeJS.Timer;
    private cpuTimer: NodeJS.Timer;
    private partitionTimer: NodeJS.Timer;

    public initializedAllData = false;

    public cpuData: ICPUData = {
        producer: "",
        fullName: "",
        frequency: 0,
        physicalCores: 0,
        logicalCores: 0,
    };
    public cpuUsage: ICPUUsage = { values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], timestamps: ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0"] };
    public ramData: IRAMData = {
        free: 0,
        total: 0,
        used: 0,
        freePercentage: 0,
        usedPercentage: 0,
    };
    public partitions: IPartitionData[] = [];

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
            this.ramData.free = parseFloat(
                (os.freemem() / 1073741824).toFixed(2)
            );
            this.ramData.total = parseFloat(
                (os.totalmem() / 1073741824).toFixed()
            );
            this.ramData.used = parseFloat(
                (this.ramData.total - this.ramData.free).toFixed(2)
            );

            // RAM values in %
            this.ramData.freePercentage = parseFloat(
                ((this.ramData.free * 100) / this.ramData.total).toFixed(2)
            );
            this.ramData.usedPercentage = parseFloat(
                (100 - this.ramData.freePercentage).toFixed(2)
            );

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
}
