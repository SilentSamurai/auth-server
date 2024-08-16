const {faker} = require('@faker-js/faker');
// or, if desiring a different locale
// const { fakerDE: faker } = require('@faker-js/faker');
const fs = require('node:fs');


const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBhdXRoLnNlcnZlci5jb20iLCJlbWFpbCI6ImFkbWluQGF1dGguc2VydmVyLmNvbSIsIm5hbWUiOiJTdXBlciBBZG1pbiIsInVzZXJJZCI6IjliNTc0YmVhLWY1ZTQtNDcxMS04Y2U1LWRkMjZkMzhiOTVlOCIsInRlbmFudCI6eyJpZCI6IjQ3M2NjZjkxLTFkZWEtNDhkNi04OTU0LTc0ODgyMmRlZDk4NCIsIm5hbWUiOiJHbG9iYWwgRGVmYXVsdCBUZW5hbnQiLCJkb21haW4iOiJhdXRoLnNlcnZlci5jb20ifSwic2NvcGVzIjpbIlNVUEVSX0FETUlOIiwiVEVOQU5UX0FETUlOIiwiVEVOQU5UX1ZJRVdFUiJdLCJncmFudF90eXBlIjoicGFzc3dvcmQiLCJpYXQiOjE3MjMxMTM3MzksImV4cCI6MTcyMzExNzMzOSwiaXNzIjoiYXV0aC5zZXJ2ZXIuY29tIn0.DXYExVeywh3IQfoZzfwbaaMgvf-avG9XBM7m-KHOzaFdr2I3IjccBKoRSSIOMtKqf-QtJKBMmR-_yPzmRzdBxl0H7iTH-WRIomQIZAYWG_BD0VjkS8NrFkzLpgC9Q9B1pSBJQZAMSYQH36EOss3o4KVIV9wX4h01I7dnSMPWApoLIb771aUV_PsRnDPRYOp3_EVjCnNogKnXIDg2rvVn5cCy7Th1_MPtdb5hMrQrKxMvoy3_K4KivhoIzqmHre0OPzCFIfLRwDHJz3IHlkNwUS1Bvs6LiffK7zXKIKqZV5hQNdjjnBxm7g5U4T-fVIZ1GG0xiozp-F6wAxP8Cp6g3Q"

async function createUser(name, email) {
    await fetch("http://localhost:9001/api/users/create", {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "authorization": "Bearer " + token,
            "content-type": "application/json",
        },
        "body": JSON.stringify({
            "name": name,
            "email": email,
            "password": "Train9000"
        }),
        "method": "POST"
    });
}

USERS = []

async function main() {
    for (let i = 0; i < 1000; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const name = faker.person.fullName({firstName, lastName});
        const randomEmail = faker.internet.email({firstName, lastName, allowSpecialCharacters: false}); // Kassandra.Haley@erich.biz

        USERS.push({
            firstName: firstName,
            lastName: lastName,
            name: name,
            email: randomEmail,
        })
        await createUser(name, randomEmail);
    }


    const content = JSON.stringify(USERS);
    fs.writeFile('./users.json', content, err => {
        if (err) {
            console.error(err);
        } else {
            // file written successfully
        }
    });

}

main()