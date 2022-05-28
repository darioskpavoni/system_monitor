export enum EDBEvents {
    NO_SUCH_TABLE = "no-such-table",
    NO_MATCHES = "no-matches"
}

export type TDBResults = string[] | [] | EDBEvents;

export interface IUserCredentials {
    username: string;
    email?: string;
    password: string;
}

export enum EUserAuthStatus {
    SUCCESSFUL = "Successful",
    WRONG_CREDENTIALS = "Wrong credentials",
    NO_SUCH_USER = "No such user"
}