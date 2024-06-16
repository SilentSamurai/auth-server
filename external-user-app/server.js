const http = require('http');
const fs = require('fs');
const path = require('path');
const {parse} = require("node:url");

const server = http.createServer((req, res) => {
    // Get the file path from the request URL
    // let filePath = '.' + req.url;
    let parsedUrl = parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Remove URL parameters
    let filePath = '.' + pathname.split('?')[0];

    // If the requested path is a directory, serve index.html by default
    if (filePath === './') {
        filePath = './index.html';
    }

    // Construct the absolute path to the file
    filePath = path.resolve(filePath);
    console.log(`Serving : ${filePath}`);

    // Check if the file exists
    fs.exists(filePath, (exists) => {
        if (exists) {
            // Read the file
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    // Error reading the file
                    res.writeHead(500);
                    res.end('Error reading the file');
                } else {
                    // Serve the file with appropriate content type
                    const contentType = getContentType(filePath);
                    res.writeHead(200, {'Content-Type': contentType});
                    res.end(data);
                }
            });
        } else {
            // File not found
            res.writeHead(404);
            res.end('File not found');
        }
    });
});

// Helper function to determine the content type based on file extension
function getContentType(filePath) {
    const extname = path.extname(filePath);
    switch (extname) {
        case '.html':
            return 'text/html';
        case '.js':
            return 'text/javascript';
        case '.css':
            return 'text/css';
        case '.json':
            return 'application/json';
        case '.png':
            return 'image/png';
        case '.jpg':
            return 'image/jpg';
        case '.gif':
            return 'image/gif';
        default:
            return 'application/octet-stream';
    }
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
