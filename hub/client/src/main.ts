import { ISystemData } from "./ISystemData";

let nodesData: ISystemData = {}
let UPDATE_TIMER = 2000;
let activeTab: string;

const tabsContainer = document.querySelector(".tabs")! as HTMLElement;


const getDataTimer = setTimeout(function repeat() {
    fetch("/system-data").then(response => response.json()).then(data => nodesData = data);

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
                }

                // make the clicked tab the active one
                tab.classList.add("active");
                activeTab = element

                console.log(`Active tab: ${activeTab}`);

            })
        }

    }


    setTimeout(repeat, UPDATE_TIMER);
}, UPDATE_TIMER);

