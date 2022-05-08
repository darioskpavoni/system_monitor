// Obtain constant flow of data about CPU, RAM and DISK from System.ts and send it to hub

import { data } from "./main";
import { System } from "./System";
import { ISystemData } from "./ISystemData";

export class SystemData extends System {
    constructor() {
        super();
        console.log("System class constructor has been called...");
    }

    public generateObject(id: string): ISystemData {
        const obj = {
            [id]: {
                "os": data.os,
                "hostname": data.hostname,
                "cpuInfo": data.cpuData,
                "cpuUsage": data.cpuUsage,
                "ram": data.ramData,
                "partitions": data.partitions
            }
        };
        return obj;
    }
}
