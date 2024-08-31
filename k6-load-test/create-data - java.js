const {faker, fa} = require('@faker-js/faker');
// or, if desiring a different locale
// const { fakerDE: faker } = require('@faker-js/faker');
const fs = require('node:fs');


const BASE_URL = 'http://localhost:8080'

async function createUser(name, email) {
    await fetch(`${BASE_URL}/api/signUp`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            // "authorization": "Bearer " + token,
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
	
	console.log("starting");
	
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