import { IUserCredentials } from "./IConfig";

const username = document.querySelector("#input-username")! as HTMLInputElement;
const password = document.querySelector("#input-psw")! as HTMLInputElement;
const loginBtn = document.querySelector(".login-btn")! as HTMLElement;

loginBtn.addEventListener("click", authenticate)


function authenticate() {
    const data: IUserCredentials = {
        username: username.value.toString(),
        password: password.value.toString()
    }

    if (!data.username || !data.password) {
        console.log("Missing credentials!");
        return;
    }

    fetch("/login", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then((res) => {
        // redirect if auth was successful
        if (res.status === 200) {
            /* window.location.replace("index.html"); */
            console.log(res);

        }


    })
}
