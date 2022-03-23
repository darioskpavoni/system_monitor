// Obtain constant flow of data about CPU, RAM and DISK 

import { System } from "./System";


export class SystemData extends System {
    constructor() {
        super();
        console.log("System class constructor has been called...");
    }
}