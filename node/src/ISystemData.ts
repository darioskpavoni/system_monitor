export interface ICPUData {
    fullName: string;
    producer: string;
    frequency: number;
    physicalCores: number;
    logicalCores: number;
}

export interface ICPUUsage {
    values: number[],
    timestamps: string[]
}

export interface IRAMUsage {
    free: number[];
    total: number[];
    used: number[];
    freePercentage: number[];
    usedPercentage: number[];
    timestamps: string[];
}

export interface IPartitionUsage {
    label: string;
    free: number;
    total: number;
    used: number;
    freePercentage: number;
    usedPercentage: number;
}

export interface IProcess {
    name: string;
    pid: number;
    memUsage: number;
}

export interface ISystemDataFields {
    os: NodeJS.Platform,
    hostname: string,
    cpuInfo: ICPUData,
    cpuUsage: ICPUUsage,
    ram: IRAMUsage,
    partitions: IPartitionUsage[],
    processes: IProcess[]
}
export interface ISystemData {
    [key: string]: ISystemDataFields;
}

