import Chart, { ChartConfiguration, ChartTypeRegistry } from 'chart.js/auto';
import { IProcess } from './ISystemData';
import { nodesData, activeNode } from "./main";
// to fix regeneratorRuntime error (which appears when using async functions in this file, for some reason), also allows me to use got
import 'regenerator-runtime/runtime'

export let firstRender: boolean = true;

const cpuGraphContainer = document.querySelector(".cpuUsageGraph")! as HTMLCanvasElement;
const memoryGraphContainer = document.querySelector(".ramUsageGraph")! as HTMLCanvasElement;
const diskGraphContainer = document.querySelector(".diskUsageGraph")! as HTMLElement;
const processListContainer = document.querySelector(".processList")! as HTMLElement;

const cpuModelContainer = document.querySelector(".cpuModel")! as HTMLParagraphElement;
const ramUsageGBContainer = document.querySelector(".memoryUsageGB")! as HTMLParagraphElement;

let cpuChart: Chart;
let memChart: Chart;
let renderTimer: NodeJS.Timer;
let processTimer: NodeJS.Timer;

// two different timers, because process list has lots of data, making its rerender very resource-heavy
const DATA_DISPLAY_TIMER = 2000;
const PROCESS_RENDER_TIMER = 10000;

export class DataDisplay {
    private static processList: IProcess[];
    private static previousProcessList: IProcess[];

    public static render() {
        clearTimeout(renderTimer);
        DataDisplay.renderQuadrants(activeNode);
        void DataDisplay.renderProcessList(activeNode);
        // it's not first render anymore
        firstRender = false;
        renderTimer = setTimeout(function repeat() {
            if (activeNode !== undefined) {
                // this re-renders every quadrant except the process one
                DataDisplay.renderQuadrants(activeNode);
            }
            setTimeout(repeat, DATA_DISPLAY_TIMER)
        }, DATA_DISPLAY_TIMER);

        // process list has a separate timer because of the big amount of data
        processTimer = setTimeout(function repeat() {
            if (activeNode !== undefined) {
                void DataDisplay.renderProcessList(activeNode);
            }
            setTimeout(repeat, PROCESS_RENDER_TIMER)
        }, PROCESS_RENDER_TIMER);

    }


    private static renderQuadrants(node: string) {
        this.renderCPUModel(node);
        this.renderCPUChart(node);
        this.renderRAMChart(node);
        this.renderRAMUsageGB(node);
    }


    private static renderCPUModel(node: string) {
        cpuModelContainer.innerText = `${nodesData[node].cpuInfo.fullName} [${nodesData[node].cpuInfo.physicalCores}C-${nodesData[node].cpuInfo.logicalCores}T] [${nodesData[node].cpuUsage.values[nodesData[node].cpuUsage.values.length - 1]}%]`;
    }

    private static renderRAMUsageGB(node: string) {
        ramUsageGBContainer.innerText = `[${nodesData[node].ram.used[nodesData[node].ram.used.length - 1]}GB of ${nodesData[node].ram.total[nodesData[node].ram.total.length - 1]}GB] [${nodesData[node].ram.usedPercentage[nodesData[node].ram.usedPercentage.length - 1]}%]`;
    }


    private static renderCPUChart(node: string) {
        const cpuUsage: number[] = nodesData[node].cpuUsage.values;
        const cpuTimestamps: string[] = nodesData[node].cpuUsage.timestamps;

        const data = {
            labels: cpuTimestamps,
            datasets: [{
                label: '[%]',
                data: cpuUsage,
                fill: true,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        };

        const config: ChartConfiguration<keyof ChartTypeRegistry, number[], unknown> = {
            type: 'line',
            data: data,
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        min: 0,
                        max: 100
                    }
                },
                animation: {
                    duration: 0
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
            }
        };


        if (firstRender) {
            cpuChart = new Chart(cpuGraphContainer, config);
        } else {
            cpuChart.data.labels = cpuTimestamps;
            cpuChart.data.datasets = [{
                label: '[%]',
                data: cpuUsage,
                fill: true,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }];
            cpuChart.update();
        }

    }

    private static renderRAMChart(node: string) {
        /* const ramUsed: number = nodesData[node].ram.usedPercentage;
        const ramUsed: number = nodesData[node].ram.usedPercentage; */

        const ramUsage: number[] = nodesData[node].ram.usedPercentage;
        const ramTimestamps: string[] = nodesData[node].ram.timestamps;

        const data = {
            labels: ramTimestamps,
            datasets: [{
                label: '[%]',
                data: ramUsage,
                fill: true,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        };

        const config: ChartConfiguration<keyof ChartTypeRegistry, number[], unknown> = {
            type: 'line',
            data: data,
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        min: 0,
                        max: 100
                    }
                },
                animation: {
                    duration: 0
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        };


        if (firstRender) {
            memChart = new Chart(memoryGraphContainer, config);
        } else {
            memChart.data.labels = ramTimestamps;
            memChart.data.datasets = [{
                label: '[%]',
                data: ramUsage,
                fill: true,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }];
            memChart.update();
        }
    }

    private static async renderProcessList(node: string) {
        const newProcessList = nodesData[node].processes;

        this.processList = newProcessList;

        let HTML = "";
        for (const proc of this.processList) {
            const name = proc.name;
            const pid = proc.pid ?? "";
            const memUsage = proc.memUsage;

            // add each process to an HTML string
            HTML += `<div class="process"><div class="processName processInfo">${name}</div><div class="processPid processInfo">${pid}</div><div class="processMemUsage processInfo">${memUsage}MB</div></div>`;
        }

        // assign HTML to the container in one go, to avoid massive lags 
        // previously I had tried to add to innerHTML inside the for..loop, but was too laggy
        processListContainer.innerHTML = HTML;
    }

}