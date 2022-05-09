

export class Logger {
    public static log(item: any) {
        const logsEnabled = (process.env.LOGS === "true");
        if (logsEnabled) {
            console.log(item);
        }
    }
}