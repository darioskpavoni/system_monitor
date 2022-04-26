// Obtain constant flow of data about CPU, RAM and DISK from System.ts and send it to hub

import { System } from "./System";

export const TIMER = 1000;

export class SystemData extends System {
    constructor() {
        super();
        console.log("System class constructor has been called...");
    }
}
