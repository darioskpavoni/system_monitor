import { IUserCredentials } from "./IConfig";
// to fix regeneratorRuntime error (which appears when using async functions in this file, for some reason), also allows me to use got
import 'regenerator-runtime/runtime'

const username = document.querySelector("#input-username")! as HTMLInputElement;
const password = document.querySelector("#input-psw")! as HTMLInputElement;
const loginBtn = document.querySelector(".btn")! as HTMLElement;

loginBtn.addEventListener("click", authenticate)

async function authenticate() {
    const data: IUserCredentials = {
        username: username.value.toString(),
        password: password.value.toString()
    }

    if (!data.username || !data.password) {
        console.log("Missing credentials!");
        return;
    }

    // send data to hub for authentication
    const response = await submitData(data);
    console.log(`[AUTH] Status code: ${response.status}`);
    // await on auth.json() because json returns a promise -> without await, I get a promise in the console log
    const body = await response.json();
    console.log(`[AUTH] Message: ${body.message}`);

    if (response.status === 200) {
        // if auth succeded, add session token to sessionStorage and redirect to index.html
        setSessionToken(body.sessionToken);
    }


}

function submitData(data: IUserCredentials) {
    return new Promise<Response>(async (resolve, reject) => {
        await fetch("/login", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }).then(res => resolve(res)).catch(err => reject(err));
    })
}

function setSessionToken(token: string) {
    sessionStorage.setItem("sysMonitorSessionToken", token);
    window.location.replace("index.html");
    return;
}
