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


const { Console } = require('console');
const { Transform } = require('stream');

function table(input) {
    // @see https://stackoverflow.com/a/67859384
    const ts = new Transform({ transform(chunk, enc, cb) { cb(null, chunk) } })
    const logger = new Console({ stdout: ts })
    logger.table(input)
    const table = (ts.read() || '').toString()
    let result = '';
    for (let row of table.split(/[\r\n]+/)) {
        let r = row.replace(/[^┬]*┬/, '┌');
        r = r.replace(/^├─*┼/, '├');
        r = r.replace(/│[^│]*/, '');
        r = r.replace(/^└─*┴/, '└');
        r = r.replace(/'/g, ' ');
        result += `${r}\n`;
    }
    console.log(result);
}

async function main() {
    // const size = await dirSize('C:\\Users\\P1360072\\AppData\\Local');
    // console.log(size / (1024 * 1024 * 1024));

    table([
        {
            Context: "CPU Bound Task",
            metric: "http req",
            Java: "18 r/s",
            NodeJS: "1 r/s",
            "NodeJS (Clustered)": "8 r/s",
            comments: ""
        },
        {
            Context: "    - 150 vus for 30s ",
            metric: "cpu",
            Java: "100%",
            NodeJS: "100%",
            "NodeJS (Clustered)": "100%",
            comments: ""
        },
        {
            Context: "",
            metric: "memory",
            Java: "~ 2 GB",
            NodeJS: "~ 1 GB",
            "NodeJS (Clustered)": "~ 2 GB",
            comments: ""
        },
        {
            Context: "IO Bound Task",
            metric: "http req",
            Java: "190 r/s",
            NodeJS: "804 r/s",
            "NodeJS (Clustered)": "951 r/s",
            comments: ""
        },
        {
            Context: "    - 1000 vus for 10s ",
            metric: "cpu",
            Java: "60 - 70%",
            NodeJS: "45%",
            "NodeJS (Clustered)": "70%",
            comments: ""
        },
        {
            Context: "",
            metric: "memory",
            Java: "~ 4 GB",
            NodeJS: "~ 2 GB",
            "NodeJS (Clustered)": "~ 2 GB",
            comments: ""
        }
    ])
}

main();