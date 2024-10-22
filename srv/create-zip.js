const fs = require('fs');
const archiver = require('archiver');

const output = fs.createWriteStream(__dirname + "/dist/deploy.zip");
const archive = archiver('zip', {zlib: {level: 9}});

archive.pipe(output);

archive.glob('dist/**', {
    cwd: __dirname,
    ignore: ['*/node_modules/**', '**/**.zip']
});

archive.directory('dist/envs', 'dist/envs');

archive.file('package.json', {});

archive.finalize();

