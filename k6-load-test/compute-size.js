const {readdir, stat} = require('fs/promises');
const {join} = require('path');
const { appendFileSync } = require('fs');

const append = (path, size) => {
    if( size < 1024 * 1024) return;
    const csv = `"${path}",${size / (1024) }\n`; // Construct a CSV row
    try {
        appendFileSync("./size.csv", csv); // Append the CSV row to the file
    } catch (error) {
        console.log(error);
    }
};

output = []

const dirSize = async dir => {
    try {
        const files = await readdir(dir, {withFileTypes: true});
        const paths = files.map(async file => {
            const path = join(dir, file.name);
            if (file.isDirectory()) {
                const size = await dirSize(path)
                append(path, size);
                return size;
            }
            if (file.isFile()) {
                const {size} = await stat(path);
                append(path, size);
                return size;
            }
            return 0;
        });
        return (await Promise.all(paths)).flat(Infinity).reduce((i, size) => i + size, 0);
    } catch (e) {
        console.error(`${dir} : ${e.message}`);
    }
    return 0;
}


async function main() {
    const size = await dirSize('C:\\Users\\P1360072\\AppData\\Local');
    console.log(size / (1024 * 1024 * 1024));


}

main();