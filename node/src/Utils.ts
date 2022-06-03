import { EKillPidStatus } from "./IConfig";

export class Utils {
    public static getTimestamp() {
        const date = new Date();
        let hour = date.getHours().toString();
        let minute = date.getMinutes().toString();
        let seconds = date.getSeconds().toString();

        if (hour.length < 2) {
            hour = `0${hour}`;
        }

        if (minute.length < 2) {
            minute = `0${minute}`;
        }

        if (seconds.length < 2) {
            seconds = `0${seconds}`;
        }

        const timestamp = `${hour}:${minute}:${seconds}`

        return timestamp;
    }

    public static killPID(_pid: string) {
        console.log(`[CLIENT] Ready to kill PID: ${_pid}`);
        return new Promise<EKillPidStatus>((resolve, reject) => {
            const pid = parseInt(_pid);
            try {
                const res = process.kill(pid);
                console.log(`[CLIENT] Process ${pid} killed with success`);
                return resolve(EKillPidStatus.SUCCESS);

            } catch (error) {
                console.log(`[CLIENT] Error while killing process ${pid}: ${error}`);
                return resolve(EKillPidStatus.FAILED);
            }
        })
    }
}