export enum EDBEvents {
    NO_SUCH_TABLE = "no-such-table",
    NO_MATCHES = "no-matches",
    COMMAND_EXECUTED_SUCCESSFULLY = "command-executed-successfully",
    FAILED_TO_RUN_COMMAND = "failed-to-run-command"
}

export type TDBResults = string[] | [] | EDBEvents;

export interface IUserCredentials {
    username: string;
    email?: string;
    password: string;
}

export enum EUserAuthStatus {
    SUCCESSFUL = "Successful authentication",
    WRONG_CREDENTIALS = "Wrong credentials",
    NO_SUCH_USER = "No such user"
}

export enum EUserSignupStatus {
    SUCCESSFUL = "Successful registration",
    USER_ALREADY_EXISTS = "User with these credentials already exists",
    ERROR = "Error during signup"
}