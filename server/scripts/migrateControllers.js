const fs = require("fs");
const path = require("path");

const controllersDir = path.join(__dirname, "../controllers");

function updateFile(filePath) {
    let content = fs.readFileSync(filePath, "utf-8");

    // Replace references of seller_id to seller where appropriate
    // Usually it is object keys like { seller_id: ... } or populate('seller_id') or property.seller_id

    // 1. .populate("seller_id") -> .populate("seller")
    content = content.replace(/\.populate\((['"`])seller_id\1/g, '.populate($1seller$1');

    // 2. { seller_id: -> { seller:
    content = content.replace(/seller_id\s*:/g, 'seller:');

    // 3. property.seller_id -> property.seller
    content = content.replace(/\.seller_id/g, '.seller');

    // 4. "seller_id" inside select queries: .select("... seller_id ...") -> .select("... seller ...")
    content = content.replace(/(select\(|select\s+)(['"`].*?)seller_id(.*?['"`])/g, '$1$2seller$3');

    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Updated ${path.basename(filePath)}`);
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith(".js")) {
            updateFile(fullPath);
        }
    }
}

processDirectory(controllersDir);
console.log("Migration complete.");
