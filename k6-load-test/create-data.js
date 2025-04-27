const {faker, fa} = require('@faker-js/faker');
// or, if desiring a different locale
// const { fakerDE: faker } = require('@faker-js/faker');
const fs = require('node:fs');


const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBhdXRoLnNlcnZlci5jb20iLCJlbWFpbCI6ImFkbWluQGF1dGguc2VydmVyLmNvbSIsIm5hbWUiOiJTdXBlciBBZG1pbiIsInVzZXJJZCI6IjBlNDQ0NzljLTNkOTktNGZiNS1iODBmLTZkN2M2ZmU2MDgwZCIsInRlbmFudCI6eyJpZCI6ImM5MzA4MTVkLTZjZTUtNGNjOS04MjNmLWE4YzBhOTZiZjNiNiIsIm5hbWUiOiJHbG9iYWwgRGVmYXVsdCBUZW5hbnQiLCJkb21haW4iOiJhdXRoLnNlcnZlci5jb20ifSwic2NvcGVzIjpbIlRFTkFOVF9WSUVXRVIiLCJURU5BTlRfQURNSU4iLCJTVVBFUl9BRE1JTiJdLCJncmFudF90eXBlIjoicGFzc3dvcmQiLCJpYXQiOjE3MjQ3Mzk2OTEsImV4cCI6MTcyNDc0MzI5MSwiaXNzIjoiYXV0aC5zZXJ2ZXIuY29tIn0.cUhTIqY9EzcjBcAme96HBh14eUnpLmf75hC0dUb1aDDJ4zQ0rRtaYRxHtvl_d9P_b74NsZ1VpXIcyWpJjIqQPsmzoWT8zl62MBF7UHKAMGf8UF7-UN1pKjsRSLX56eAIMF2yz8PIV6jzGIz8CnzJ3VIUjlpP4gIZ6t3d273Si9IHSpv4Bq5wWBc_jaeFyGRo-b0f2Jk1w4edQs05knPLPBUN8gbj7UPFbZYIJetlw4XoizTcbBE8faqP8-WGSQr2s_97H5EIUhL8OGJvGkV95aiTBHyVRvTtLm9d6nvbUSQdyltKiG3ZLmAqoPEgG3iMb7i51aBUouYdGqyxCI2i7g"

const BASE_URL = 'http://localhost:9001'

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
            "phoneNo": faker.phone.number(),
            "uuid": faker.database.mongodbObjectId(),
            "password": "Train9000"
        }),
        "method": "POST"
    });
}

USERS = []

async function main() {
		
	for (let j = 0; j < 20 ; j++) {
		let promises = []
		for (let i = 0; i < 50; i++) {
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
			promises.push(createUser(name, randomEmail));
		}
		await Promise.all(promises);
		console.log("batch completed " , j)
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