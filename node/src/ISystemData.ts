export interface ICPUData {
    fullName: string;
    producer: string;
    frequency: number;
    physicalCores: number;
    logicalCores: number;
}

export interface IRAMData {
    free: number;
    total: number;
    used: number;
    freePercentage: number;
    usedPercentage: number;
}

export interface IPartitionData {
    label: string;
    free: number;
    total: number;
    used: number;
    freePercentage: number;
    usedPercentage: number;
}
