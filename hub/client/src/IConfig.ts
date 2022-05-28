export enum DBEvents {
    NO_SUCH_TABLE = "no-such-table",
    NO_MATCHES = "no-matches"
}

export type DBResults = string[] | [] | DBEvents;

export interface IUserCredentials {
    username: string;
    email?: string;
    password: string;
}

export enum UserAuthStatus {
    SUCCESSFUL = "Successful",
    WRONG_CREDENTIALS = "Wrong credentials",
    NO_SUCH_USER = "No such user"
}