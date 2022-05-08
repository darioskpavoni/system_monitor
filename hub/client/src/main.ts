console.log(124);


fetch("http://localhost:3001/about").then(response => response.json()).then(data => console.log(data));
