const {faker} = require('@faker-js/faker');
// or, if desiring a different locale
// const { fakerDE: faker } = require('@faker-js/faker');


const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBhdXRoLnNlcnZlci5jb20iLCJlbWFpbCI6ImFkbWluQGF1dGguc2VydmVyLmNvbSIsIm5hbWUiOiJTdXBlciBBZG1pbiIsInVzZXJJZCI6IjMzYTE1M2FmLWIzMTItNDQ0NS05YTQ0LWJiNjM0MzU3ZTczMiIsInRlbmFudCI6eyJpZCI6ImUxMDUzODM3LTYyMzYtNDg2Yi04OTgxLTU5NWE5NzBiYjZjYSIsIm5hbWUiOiJHbG9iYWwgRGVmYXVsdCBUZW5hbnQiLCJkb21haW4iOiJhdXRoLnNlcnZlci5jb20ifSwic2NvcGVzIjpbIlNVUEVSX0FETUlOIiwiVEVOQU5UX0FETUlOIiwiVEVOQU5UX1ZJRVdFUiJdLCJncmFudF90eXBlIjoicGFzc3dvcmQiLCJpYXQiOjE3MjI4NTg0MDcsImV4cCI6MTcyMjg2MjAwNywiaXNzIjoiYXV0aC5zZXJ2ZXIuY29tIn0.hZOrX-JVL9Qav3rbyiLnttUROCvb2x1uU5M6yACy9UYhJUxfw7vEJ9gGy5_dZIOR59vY-PlyV97jw27GsdY3piY-30SqxPpT6et-1SfcznkondUZukcIN4DWbZn9sw_a880Ph9CMhFXiAjcoi9DsTqgmK40BwoPp4PvlMhlMAL8XRa8pzIolm08POeKPedpw7qoHCzowLPhPBOWZ_r959P3SYApQAUetn7s-VbHLzDeTKC5GX2hNeTeaWoclC666A6_iXzXfZl4xUh4LID__5wlvTTL-IrPjxC03hoLXBjTC0lVjz0iBugDF0civNE-vlHyUGzRZObTqu0cAc2N68Q"

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
        const randomEmail = faker.internet.email({firstName, lastName, allowSpecialCharacters: false}); // Kassandra.Haley@erich.biz

        await createUser(name, randomEmail);
    }
}

main()