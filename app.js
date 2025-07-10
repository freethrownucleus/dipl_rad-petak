const http = require("http");
const url = require("url");
const fs = require("fs").promises;
const path = require("path");
const bcrypt = require("bcrypt");

const PORT = 8080;
const usersFilePath = path.join(__dirname, "users.json");
const staticFolder = path.join(__dirname, "public");

const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*'
};

// Validacija korisničkih podataka
function isValidCredentials(user, pass) {
    return (
        typeof user === "string" &&
        typeof pass === "string" &&
        /^[a-zA-Z0-9_]{3,20}$/.test(user) &&
        pass.length >= 4
    );
}

async function checkOrRegisterUser(user, pass) {
    try {
        let data;
        try {
            const content = await fs.readFile(usersFilePath, "utf8");
            data = JSON.parse(content).users || [];
        } catch {
            data = [];
        }

        const userIndex = data.findIndex(u => u.user === user);

        if (userIndex === -1) {
            const hashedPass = await bcrypt.hash(pass, 10);
            data.push({ user, pass: hashedPass, games: {} });
            await fs.writeFile(usersFilePath, JSON.stringify({ users: data }, null, 2));
            return { status: 200, body: {} };
        } else {
            const match = await bcrypt.compare(pass, data[userIndex].pass);
            if (match) return { status: 200, body: {} };
            else return { status: 400, body: { error: "User registered with a different password" } };
        }
    } catch (err) {
        console.error("Error handling user registration:", err);
        return { status: 500, body: { error: "Internal server error" } };
    }
}

async function processPostRequest(req, res) {
    const { pathname } = url.parse(req.url, true);
    let body = "";

    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
        let data;
        try {
            data = JSON.parse(body);
        } catch {
            res.writeHead(400, headers);
            res.end(JSON.stringify({ error: "Invalid JSON format" }));
            return;
        }

        const { user, pass } = data;
        if (!isValidCredentials(user, pass)) {
            res.writeHead(400, headers);
            res.end(JSON.stringify({ error: "Invalid username or password format" }));
            return;
        }

        if (pathname === "/register") {
            const result = await checkOrRegisterUser(user, pass);
            res.writeHead(result.status, headers);
            res.end(JSON.stringify(result.body));
        } else {
            res.writeHead(404, headers);
            res.end(JSON.stringify({ error: "Endpoint not found" }));
        }
    });

    req.on("error", err => {
        console.error("Request error:", err);
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: "Request error" }));
    });
}

async function serveStaticFile(req, res) {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname === "/" ? "index.html" : parsedUrl.pathname;
    const fullPath = path.join(staticFolder, pathname);

    try {
        const stat = await fs.stat(fullPath);
        if (!stat.isFile()) throw new Error();

        const ext = path.extname(fullPath).toLowerCase();
        const contentTypes = {
            ".html": "text/html",
            ".css": "text/css",
            ".js": "application/javascript",
            ".json": "application/json",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif"
        };

        const contentType = contentTypes[ext] || "text/plain";
        const file = await fs.readFile(fullPath);

        res.writeHead(200, { "Content-Type": contentType });
        res.end(file);
    } catch {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
    }
}

http.createServer((req, res) => {
    if (req.method === "POST") {
        processPostRequest(req, res);
    } else if (req.method === "GET") {
        serveStaticFile(req, res);
    } else {
        res.writeHead(405, headers);
        res.end(JSON.stringify({ error: "Method not allowed" }));
    }
}).listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
