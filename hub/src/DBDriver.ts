import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import { EDBEvents, TDBResults, IUserCredentials, EUserAuthStatus, EUserSignupStatus } from "./IConfig";


export class DBDriver {
    public static instance: DBDriver;

    private sqlite3: sqlite3.sqlite3 = sqlite3.verbose();
    private db: sqlite3.Database;
    private sql: string;

    private dbPathEnv = process.env.DB_PATH ?? "db/users.db";
    private dbPath = path.join(process.cwd(), this.dbPathEnv);


    constructor() {
        this.initializeDB();
    }

    public static getInstance() {
        if (!DBDriver.instance) {
            DBDriver.instance = new DBDriver();
        }
        return DBDriver.instance;
    }

    private initializeDB() {
        if (fs.existsSync(this.dbPath)) {
            console.log("[DBDriver] Database detected");

        } else {
            console.log("[DBDriver] Database created");
            fs.openSync(this.dbPath, "w");
        }


        this.ensureUsersTable();
    }

    private loadDB() {
        // load db 
        try {
            this.db = new sqlite3.Database(this.dbPath);
            console.log(`[DBDriver] Database loaded`);
        } catch (error) {
            console.log(`[DBDriver] Error while loading database: ${error}`);
        }
    }

    private async ensureUsersTable() {
        // run a query to check if users table exists, otherwise create it
        this.sql = `SELECT * FROM users`;
        const check: TDBResults = await this.query(this.sql);
        if (check === EDBEvents.NO_SUCH_TABLE) {
            console.log(`[DBDriver] Creating users tbl`);
            this.sql = `CREATE TABLE users(id INTEGER PRIMARY KEY,username VARCHAR(25),email VARCHAR(25),password VARCHAR(25));`
            this.run(this.sql);
        }
        // console.log(check);
        console.log(`[DBDriver] users tbl is ready`);
    }

    public async loginUser(credentials: IUserCredentials): Promise<EUserAuthStatus> {
        return new Promise<EUserAuthStatus>(async (resolve) => {
            // check if account exists by looking at username
            this.sql = `SELECT * FROM users WHERE username='${credentials.username}'`;
            const checkAccount: TDBResults = await this.query(this.sql);

            // if no matches -> no such user
            if (checkAccount === EDBEvents.NO_MATCHES) {
                return resolve(EUserAuthStatus.NO_SUCH_USER)
            }

            // account exists -> check the psw
            // we select first element because query returns a string[]. It's always going to be an array of one element
            // because during registration phase we cannot register 2 users with the same username
            // we use a string[] because in the future we might need to keep the possibility to query multiple records
            let dbUserData: IUserCredentials = JSON.parse(checkAccount[0] as string);

            // we use bcrypt's comparing functionality because it's safer than comparing the two strings manually
            const match = bcrypt.compareSync(credentials.password, dbUserData.password);

            if (!match) {
                resolve(EUserAuthStatus.WRONG_CREDENTIALS)
            }

            return resolve(EUserAuthStatus.SUCCESSFUL);
        })

    }

    public async registerUser(credentials: IUserCredentials): Promise<EUserSignupStatus> {
        return new Promise<EUserSignupStatus>(async (resolve, reject) => {
            // check if account exists by looking at email AND username (we don't want users with same email or username)
            this.sql = `SELECT * FROM users WHERE (email='${credentials.email}' OR username='${credentials.username}')`;
            const checkAccount: TDBResults = await this.query(this.sql);

            // if there are matches -> account cannot be created
            if (checkAccount !== EDBEvents.NO_MATCHES) {
                resolve(EUserSignupStatus.USER_ALREADY_EXISTS);
            }

            // there are no matches -> account can be created
            const hashedPsw = await this.hashPsw(credentials.password).catch(err => reject(err));
            this.sql = `INSERT INTO users (username, email, password) VALUES ('${credentials.username}','${credentials.email}','${hashedPsw}')`;
            const addAccount: EDBEvents = await this.run(this.sql);

            if (addAccount === EDBEvents.COMMAND_EXECUTED_SUCCESSFULLY) {
                resolve(EUserSignupStatus.SUCCESSFUL);
            }

            if (addAccount === EDBEvents.FAILED_TO_RUN_COMMAND) {
                resolve(EUserSignupStatus.ERROR);
            }

            resolve(EUserSignupStatus.ERROR);
        })
    }

    private async run(command: string): Promise<EDBEvents> {
        this.loadDB();
        console.log(`[DBDriver] ${command}`);
        return new Promise<EDBEvents>((resolve, reject) => {
            this.db.run(command, [], (err) => {
                if (err) return resolve(EDBEvents.FAILED_TO_RUN_COMMAND);
                this.db.close();
                return resolve(EDBEvents.COMMAND_EXECUTED_SUCCESSFULLY);
            });
        })

    }

    private async query(qry: string) {
        this.loadDB();
        console.log(`[DBDriver] ${qry}`);
        return new Promise<TDBResults>((resolve, reject) => {
            let results: string[] = [];

            this.db.all(qry, [], (err, rows) => {
                // handle known errors (e.g. no such table) and other generic errors
                if (err?.message && err.message.indexOf("no such table") !== -1) {
                    return resolve(EDBEvents.NO_SUCH_TABLE);
                } else if (err) {
                    return console.error(`[DBDriver][Query] ${err?.message}`)
                };

                // handle no matches/records
                if (rows.length === 0) {
                    return resolve(EDBEvents.NO_MATCHES);
                }

                rows.forEach(row => {
                    const match = JSON.stringify(row);
                    results.push(match);
                })

                this.db.close();

                return resolve(results);
            })
        })

    }

    private hashPsw(psw: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const salt = await bcrypt.genSalt();
                const hashedPsw = await bcrypt.hash(psw, salt);

                return resolve(hashedPsw);
            } catch (error) {
                return reject(error)
            }
        })

    }


} 