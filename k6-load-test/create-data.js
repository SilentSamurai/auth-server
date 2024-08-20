const {faker} = require('@faker-js/faker');
// or, if desiring a different locale
// const { fakerDE: faker } = require('@faker-js/faker');
const fs = require('node:fs');


const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBhdXRoLnNlcnZlci5jb20iLCJlbWFpbCI6ImFkbWluQGF1dGguc2VydmVyLmNvbSIsIm5hbWUiOiJTdXBlciBBZG1pbiIsInVzZXJJZCI6IjJmNDA3ZDIzLWFiZGYtNDUxNi1iYTFkLTllZWE5YTU2NGI5MiIsInRlbmFudCI6eyJpZCI6ImE0MzFkMWRkLTQ3ZTYtNDA0My1iMmVjLTNjZWFmZjMxZGNhNiIsIm5hbWUiOiJHbG9iYWwgRGVmYXVsdCBUZW5hbnQiLCJkb21haW4iOiJhdXRoLnNlcnZlci5jb20ifSwic2NvcGVzIjpbIlNVUEVSX0FETUlOIiwiVEVOQU5UX0FETUlOIiwiVEVOQU5UX1ZJRVdFUiJdLCJncmFudF90eXBlIjoicGFzc3dvcmQiLCJpYXQiOjE3MjQxMzkxMjEsImV4cCI6MTcyNDE0MjcyMSwiaXNzIjoiYXV0aC5zZXJ2ZXIuY29tIn0.Zfof6i3Yrr4h5_m45bBDixinsFaTaXiu7nc-vRdez9YDn4aNw4g2mBJdfqt4mvy7tRkFXyCcZMCSJhM_BZti4DPfsDCQ1OMi1_3O4Z6xeiPYbu5mlmJ6v8Vy7RDadNgn5TCnPQucvmm1YQjVYCR1Jm6cX815_SRwwr6HeMrO8rnzrUM0vqSkfMRMiBisegTp54ms6mPVl5RnVgPB2IE7m7_pKxYvxrXLG5RUNQ1YubqJ5eWFFLKSSrmjweOoTQ6QqVhh09_zsC1V5jGxa3xFRkBJVU2SLI1D97Q4-Vpg4n8eoBHGCqMl9ibU-c3xba-YIaKtgYnTle7rp3mwQVPXFA"
const BASE_URL = 'http://127.0.0.1:57915'

async function createUser(name, email) {
    await fetch(`${BASE_URL}/api/users/create`, {
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