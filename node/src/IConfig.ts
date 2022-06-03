export enum EKillPidStatus {
    SUCCESS = "success",
    NO_PID_INTRODUCED = "no-pid-introduced",
    NO_SUCH_PID = "no-such-pid",
    FAILED = "failed"
}
export interface IPID {
    pid: string;
    socketId?: string;
    status?: string;
}