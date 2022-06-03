// Obtain constant flow of data about CPU, RAM and DISK from System.ts and send it to hub

import { data } from "./main";
import { ISystemDataFields } from "./ISystemData";
import { System } from "./System";
import { Logger } from "./Logger"

export class SystemData {
    private system: System;

    constructor() {
        this.system = System.getInstance();
        Logger.log("System class constructor has been called...");
    }

    public static generateObject(): ISystemDataFields {
        const obj: ISystemDataFields = {
            "os": data.os,
            "hostname": data.hostname,
            "cpuInfo": data.cpuData,
            "cpuUsage": data.cpuUsage,
            "ram": data.ramData,
            "partitions": data.partitions,
            "processes": data.processes
        };
        return obj;
    }
}
