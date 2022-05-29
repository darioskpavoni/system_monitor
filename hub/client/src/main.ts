
import { DataDisplay } from "./DataDisplay";
import { ISystemData } from "./ISystemData";

let updateTimer = 2000;
export let nodesData: ISystemData = {}

let activeTab: string;
export let activeNode: string;

const tabsContainer = document.querySelector(".tabs")! as HTMLElement;
const systemDataContainer = document.querySelector(".systemData")! as HTMLElement;
systemDataContainer.style.opacity = "0";

// first render has to be faster, otherwise we wait updateTimer until we can see tabs
fetch("/system-data").then(response => response.json()).then(data => {
    nodesData = data
    updateTabs();
});
const getDataTimer = setTimeout(function repeat() {
    fetch("/system-data").then(response => response.json()).then(data => nodesData = data);

    updateTabs();

    if (Object.keys(nodesData).length !== 0) {
        console.log(nodesData);
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

                DataDisplay.render();

            })
        }
    }
}
