import Chart from 'chart.js/auto';
import { ISystemData } from "./ISystemData";

let nodesData: ISystemData = {}
let UPDATE_TIMER = 2000;
let activeTab: string;

let currentTabs: any = {};

const tabsContainer = document.querySelector(".tabs")! as HTMLElement;
const systemDataContainer = document.querySelector(".systemData")! as HTMLElement;
const cpuGraphContainer = document.querySelector(".cpuUsageGraph")! as HTMLCanvasElement;
const memoryGraphContainer = document.querySelector(".ramUsageGraph")! as HTMLElement;
const diskGraphContainer = document.querySelector(".diskUsageGraph")! as HTMLElement;
const processListContainer = document.querySelector(".processList")! as HTMLElement;


systemDataContainer.style.opacity = "0";

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

                // render graphs
                renderGraphs(node);

            })


        }

    }


    setTimeout(repeat, UPDATE_TIMER);
}, UPDATE_TIMER);


const renderGraphs = (node: string) => {
    console.log("RENDERING NODE");

    console.log(nodesData[node].cpuUsage);


    // replace with graph
    const cpuChart = new Chart(cpuGraphContainer, {
        type: 'line',
        data: {
            /* labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'], */
            datasets: [{
                label: 'Percentage',
                data: nodesData[node].cpuUsage,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Chart.js Line Chart - Cubic interpolation mode'
                },
            },
            interaction: {
                intersect: false,
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Value'
                    },
                    suggestedMin: -10,
                    suggestedMax: 200
                }
            }
        },
    });

    // memoryGraphContainer
    // diskGraphContainer
    // processListContainer
}