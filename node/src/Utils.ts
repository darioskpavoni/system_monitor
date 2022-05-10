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
}