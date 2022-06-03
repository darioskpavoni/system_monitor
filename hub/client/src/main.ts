
import { DataDisplay } from "./DataDisplay";
import { EKillPidStatus, IPID } from "./IConfig";
import { ISystemData } from "./ISystemData";

let updateTimer = 2000;
export let nodesData: ISystemData = {}

let activeTab: string;
let activeSocket: string;
export let activeNode: string;
let localPendingPIDs: IPID[] = [];

const tabsContainer = document.querySelector(".tabs")! as HTMLElement;
const systemDataContainer = document.querySelector(".systemData")! as HTMLElement;
systemDataContainer.style.opacity = "0";

// event listener for processKillBtn
const processKillPidMessage = document.querySelector(".processKillMessage")! as HTMLElement;
const processKillPidContainer = document.querySelector(".processKillPid")! as HTMLInputElement;
const processKillBtn = document.querySelector(".processKillIcon")! as HTMLImageElement;
processKillBtn.addEventListener("click", killProcess);

// first render has to be instantaneous, otherwise we have to wait [updateTimer]ms until we can see tabs
fetch("/system-data").then(response => response.json()).then(data => {
    nodesData = data
    updateTabs();
});
const getDataTimer = setTimeout(function repeat() {
    fetch("/system-data").then(response => response.json()).then(data => nodesData = data);

    updateTabs();

    if (Object.keys(nodesData).length !== 0) {
        //console.log(nodesData);
    }

    setTimeout(repeat, updateTimer);
}, updateTimer);


function updateTabs() {
    // add tabs for the nodes. "node" is of type IP_HOSTNAME
    for (const node in nodesData) {
        // delete all dots because they cant be in class names
        const element = `node_${node.replace(/\./g, "")}`

        if (!document.querySelector(`.${element}`)) {
            const tab = document.createElement("div");
            tab.classList.add("tab");
            tab.classList.add(element);
            tab.innerText = nodesData[node].hostname;
            tabsContainer.appendChild(tab);

            tab.addEventListener("click", () => {
                // deactivate other active tab 
                if (activeTab !== undefined) {
                    document.querySelector(`.${activeTab}`).classList.remove("active");

                    killPidStyle("default");
                }

                // make body invisible while loading data
                if (activeTab === undefined) {
                    systemDataContainer.style.opacity = "1";
                } else {
                    // remove old systemDataContainer class
                    systemDataContainer.classList.remove(activeTab);

                }


                // make the clicked tab the active one
                tab.classList.add("active");
                activeTab = element
                systemDataContainer.classList.add(activeTab);
                console.log(`Active tab: ${activeTab}`);

                activeNode = node;
                console.log(`Active node: ${activeNode}`);
                document.title = `[${node}]`

                activeSocket = nodesData[node].socketId;
                console.log(`Active socket: ${activeSocket}`);

                DataDisplay.render();
            })
        }
    }
}

async function killProcess() {
    const pid = processKillPidContainer.value;

    if (!pid) {
        // turn pid input red if not introduced by user
        killPidStyle(EKillPidStatus.NO_PID_INTRODUCED);
        return;
    }

    const res = await killPID(pid);
    if (res.status === 200) {
        localPendingPIDs.push({ socketId: activeSocket, pid });
    }

    // check status until it does not return false 
    const checkStatus = await checkPID(pid);
    killPidStyle(checkStatus)



}

function killPidStyle(type: EKillPidStatus | string) {
    switch (type) {
        case EKillPidStatus.NO_PID_INTRODUCED:
            processKillPidContainer.style.border = "1px solid red";
            processKillPidContainer.style.backgroundColor = "#ffc6c6";
            processKillPidMessage.innerText = "Please enter a PID"
            processKillPidMessage.style.color = "red"
            processKillPidMessage.style.opacity = "1";
            break;
        case EKillPidStatus.FAILED:
            processKillPidContainer.style.border = "1px solid black";
            processKillPidContainer.style.backgroundColor = "#b9b9b9";
            processKillPidMessage.innerText = "Failed to terminate the process"
            processKillPidMessage.style.color = "red"
            processKillPidMessage.style.opacity = "1";
            break;
        case EKillPidStatus.SUCCESS:
            processKillPidContainer.style.border = "1px solid black";
            processKillPidContainer.style.backgroundColor = "#b9b9b9";
            processKillPidMessage.innerText = "Process terminated"
            processKillPidMessage.style.color = "#107e39"
            processKillPidMessage.style.opacity = "1";
            break;

        case "default":
            processKillPidContainer.style.border = "1px solid black";
            processKillPidContainer.style.backgroundColor = "#b9b9b9";
            processKillPidMessage.innerText = ""
            processKillPidMessage.style.color = "transparent"
            processKillPidMessage.style.opacity = "0";
            break;

        default:
            break;
    }
}

function killPID(pid: string) {
    const pidObj: IPID = {
        socketId: activeSocket,
        pid: pid
    };

    return new Promise<Response>(async (resolve, reject) => {
        // send kill signal
        await fetch("/kill", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                "Content-Type": "application/json"
            },
            body: JSON.stringify(pidObj)
        }).then(res => resolve(res)).catch(err => reject(err));
    })
}

let checkTimer: NodeJS.Timer;

function checkPID(pid: string) {
    const pidObj: IPID = {
        socketId: activeSocket,
        pid: pid
    };

    return new Promise<EKillPidStatus>(async (resolve, reject) => {
        // check pending action status
        let remotePendingPIDS: IPID[];

        await fetch("/PID/list", {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                "Content-Type": "application/json"
            }
        }).then(res => res.json())
            .then(async (res) => {
                remotePendingPIDS = res["pendingPIDs"];

                // if response does not have our pid or is empty, repeat
                if (remotePendingPIDS === undefined) {
                    console.log(`Waiting 2s before next check...`);
                    clearTimeout(checkTimer)
                    checkTimer = setTimeout(async () => {
                        return await checkPID(pid);
                    }, 2000);
                }

                let pidMatch = false;
                // compare local PID with exposed pending PID list
                for (const remotePID of remotePendingPIDS) {
                    for (const localPID of localPendingPIDs) {
                        if (remotePID.socketId === localPID.socketId && remotePID.pid === localPID.pid) {
                            // socketid and pid matched. remove object from the remote array
                            await removePendingPID(remotePID.socketId, remotePID.pid)
                            pidMatch = true;
                            return resolve(remotePID.status as EKillPidStatus);
                        }
                    }
                }

                if (!pidMatch) {
                    console.log(`Waiting 2s before next check...`);
                    clearTimeout(checkTimer)
                    checkTimer = setTimeout(async () => {
                        return await checkPID(pid);
                    }, 2000);
                }
            }).catch(err => reject(err));
    })
}

async function removePendingPID(socketId: string, pid: string) {
    // remove from local array
    for (let i = 0; i < localPendingPIDs.length; i++) {
        if (localPendingPIDs[i].socketId === socketId && localPendingPIDs[i].pid === pid) {
            localPendingPIDs.splice(i);
        }
    }

    // remove from remote array 
    await fetch("/PID/remove", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ socketId, pid })
    }).then(res => {
        // console.log(res)
    }).catch(err => console.log(err));


}