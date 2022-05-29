import { EUserSignupStatus, IUserCredentials } from "./IConfig";

const username = document.querySelector("#input-username")! as HTMLInputElement;
const email = document.querySelector("#input-email")! as HTMLInputElement;
const password = document.querySelector("#input-psw")! as HTMLInputElement;
const signupBtn = document.querySelector(".btn")! as HTMLElement;

signupBtn.addEventListener("click", signup)

async function signup() {
    const data: IUserCredentials = {
        username: username.value.toString(),
        email: email.value.toString(),
        password: password.value.toString()
    }

    if (!data.username || !data.email || !data.password) {
        console.log("Missing credentials!");
        return;
    }

    // send data to hub for signup
    const response = await submitData(data);

    // await on auth.json() because json returns a promise -> without await, I get a promise in the console log
    const body = await response.json();
    console.log(`[SIGNUP] Message: ${body.message}`);

    if (body.message === EUserSignupStatus.SUCCESSFUL) {
        // if signup succeded, add session token to sessionStorage and redirect to index.html
        // there are 2 possibilities: either redirect to index.html (== signup gets session token) or redirect to login.html (== signup only creates the account, login must still be done after)

        setSessionToken(body.sessionToken);
    }


}

function submitData(data: IUserCredentials) {
    return new Promise<Response>(async (resolve, reject) => {
        await fetch("/signup", {
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
