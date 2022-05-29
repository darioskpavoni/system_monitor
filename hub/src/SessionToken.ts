import crypto from "crypto";

const EXPIRES_IN = 1; // days
const VALIDITY = EXPIRES_IN * 24 * 60 * 60 * 1000; // to ms

export class SessionToken {
    public static generate(size: number): string {
        const randomData = crypto.randomBytes(size).toString("hex").slice(0, size);
        const timestamp = Date.now();
        const expiration = timestamp + VALIDITY;
        const token = JSON.stringify([timestamp, expiration, randomData]);

        return token;
    }
}