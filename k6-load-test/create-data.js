const {faker} = require('@faker-js/faker');
// or, if desiring a different locale
// const { fakerDE: faker } = require('@faker-js/faker');


const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBhdXRoLnNlcnZlci5jb20iLCJlbWFpbCI6ImFkbWluQGF1dGguc2VydmVyLmNvbSIsIm5hbWUiOiJTdXBlciBBZG1pbiIsInVzZXJJZCI6IjliNTc0YmVhLWY1ZTQtNDcxMS04Y2U1LWRkMjZkMzhiOTVlOCIsInRlbmFudCI6eyJpZCI6IjQ3M2NjZjkxLTFkZWEtNDhkNi04OTU0LTc0ODgyMmRlZDk4NCIsIm5hbWUiOiJHbG9iYWwgRGVmYXVsdCBUZW5hbnQiLCJkb21haW4iOiJhdXRoLnNlcnZlci5jb20ifSwic2NvcGVzIjpbIlNVUEVSX0FETUlOIiwiVEVOQU5UX0FETUlOIiwiVEVOQU5UX1ZJRVdFUiJdLCJncmFudF90eXBlIjoicGFzc3dvcmQiLCJpYXQiOjE3MjI4NDA1NzksImV4cCI6MTcyMjg0NDE3OSwiaXNzIjoiYXV0aC5zZXJ2ZXIuY29tIn0.VSb_hVnbAULW3jnwxCsda749lJq2hrT3MDU_KXnwWHa2v1roR6dyEB5qiNcIe7_9vdlys-UwT9ig9BJx-4K8uoacFVexdOftHTPJ7eHbU1slCn7k384tN87kp_W4MUwxS43kYgfkHbk99scrvGX53aooOCPHs2rgYz6k6jryGPVQ2RzZMSb_DxG_-rKqfXq56I7eDxp8LoImq8DNS4C02-zNLf6wnsadtKXh2X_WHYk-pJP6uwryPfgQaHQSe5griD-Lv7shubE5SkGxddxCz70hFuo7sj1qHv3e5A7w0izfTPA3egI8dmEXPMfk_wdvbmGgdGi7cnATym3rhewcCw"

async function createUser(name, email) {
    await fetch("http://localhost:9001/api/users/create", {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9",
            "authorization": "Bearer " + token,
            "content-type": "application/json",
            "sec-ch-ua": "\"Not)A;Brand\";v=\"99\", \"Google Chrome\";v=\"127\", \"Chromium\";v=\"127\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "cookie": "Webstorm-64d0bf76=b4b0b35f-9aa4-4982-a4c7-715a4ab3f0d6",
            "Referer": "http://localhost:9001/UR01",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": JSON.stringify({
            "name": name,
            "email": email,
            "password": "Train9000"
        }),
        "method": "POST"
    });
}


async function main() {
    for (let i = 0; i < 1000; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const name = faker.person.fullName({firstName, lastName});
        const randomEmail = faker.internet.email({firstName, lastName, allowSpecialCharacters: true}); // Kassandra.Haley@erich.biz

        await createUser(name, randomEmail);
    }
}

main()