const http = require('http');
const fs = require('fs');
const path = require('path');
const {parse} = require("node:url");

// Store onboard and offboard requests for verification
const onboardRequests = [];
const offboardRequests = [];

const server = http.createServer((req, res) => {
    // Get the file path from the request URL
    let parsedUrl = parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Handle onboard endpoint
    if (pathname === '/onboard/tenant/') {
        // Parse request body
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const tenantId = data.tenantId;
                const timestamp = new Date().toISOString();

                // Log detailed information about the onboard request
                console.log(`[${timestamp}] Received onboard request:`);
                console.log(`  - Tenant ID: ${tenantId}`);
                console.log(`  - Method: ${req.method}`);
                console.log(`  - Headers:`, req.headers);

                // Store the request for verification
                onboardRequests.push({
                    tenantId,
                    timestamp,
                    method: req.method,
                    headers: req.headers
                });

                // Return success response
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({appNames: []}));
            } catch (error) {
                console.error('Error processing onboard request:', error);
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: 'Invalid request body'}));
            }
        });
        return;
    }

    // Handle offboard endpoint
    if (pathname.startsWith('/offboard/tenant/')) {
        const tenantId = pathname.split('/').pop();
        const timestamp = new Date().toISOString();

        // Log detailed information about the offboard request
        console.log(`[${timestamp}] Received offboard request:`);
        console.log(`  - Tenant ID: ${tenantId}`);
        console.log(`  - Method: ${req.method}`);
        console.log(`  - Headers:`, req.headers);

        // Store the request for verification
        offboardRequests.push({
            tenantId,
            timestamp,
            method: req.method,
            headers: req.headers
        });

        // Return success response
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({appNames: []}));
        return;
    }

    // Add endpoint to get onboard request history
    if (pathname === '/onboard/history') {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(onboardRequests));
        return;
    }

    // Add endpoint to get offboard request history
    if (pathname === '/offboard/history') {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(offboardRequests));
        return;
    }

    // Add endpoint to check if a specific tenant was onboarded
    if (pathname.startsWith('/onboard/check/')) {
        const tenantId = pathname.split('/').pop();
        const requests = onboardRequests.filter(req => req.tenantId === tenantId);

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
            wasOnboarded: requests.length > 0,
            requestCount: requests.length,
            requests: requests
        }));
        return;
    }

    // Add endpoint to check if a specific tenant was offboarded
    if (pathname.startsWith('/offboard/check/')) {
        const tenantId = pathname.split('/').pop();
        const requests = offboardRequests.filter(req => req.tenantId === tenantId);

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
            wasOffboarded: requests.length > 0,
            requestCount: requests.length,
            requests: requests
        }));
        return;
    }

    // Add endpoint to check if a tenant was onboarded and then offboarded
    if (pathname.startsWith('/tenant/lifecycle/')) {
        const tenantId = pathname.split('/').pop();
        const onboardRequests = onboardRequests.filter(req => req.tenantId === tenantId);
        const offboardRequests = offboardRequests.filter(req => req.tenantId === tenantId);

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
            tenantId,
            wasOnboarded: onboardRequests.length > 0,
            onboardCount: onboardRequests.length,
            wasOffboarded: offboardRequests.length > 0,
            offboardCount: offboardRequests.length,
            onboardRequests: onboardRequests,
            offboardRequests: offboardRequests
        }));
        return;
    }

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
    console.log(`Onboard request history available at http://localhost:${PORT}/onboard/history`);
    console.log(`Offboard request history available at http://localhost:${PORT}/offboard/history`);
    console.log(`Check tenant lifecycle at http://localhost:${PORT}/tenant/lifecycle/{tenantId}`);
});
