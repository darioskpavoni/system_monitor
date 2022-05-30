import Chart, { ChartConfiguration, ChartTypeRegistry } from 'chart.js/auto';
import { nodesData, activeNode } from "./main";

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

export class DataDisplay {

    public static render() {
        clearTimeout(renderTimer);
        DataDisplay.renderGraphs(activeNode);
        // it's not first render anymore
        firstRender = false;
        renderTimer = setTimeout(function repeat() {
            if (activeNode !== undefined) {
                // console.log("Rerendered...");
                DataDisplay.renderGraphs(activeNode);
            }
            setTimeout(repeat, 2000)
        }, 2000);

    }


    private static renderGraphs(node: string) {
        this.renderCPUModel(node);
        this.renderCPUChart(node);
        this.renderRAMChart(node);
        this.renderRAMUsageGB(node);
    }


    private static renderCPUModel(node: string) {
        cpuModelContainer.innerText = `${nodesData[node].cpuInfo.fullName} [${nodesData[node].cpuInfo.physicalCores}C-${nodesData[node].cpuInfo.logicalCores}T] [${nodesData[node].cpuUsage.values[nodesData[node].cpuUsage.values.length - 1]}%]`;
    }

    private static renderRAMUsageGB(node: string) {
        ramUsageGBContainer.innerText = `[${nodesData[node].ram.used[nodesData[node].ram.used.length - 1]}GB of ${nodesData[node].ram.total[nodesData[node].ram.total.length - 1]}GB]`;
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


}