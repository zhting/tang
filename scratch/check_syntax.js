const fs = require('fs');
const path = require('path');
const htmlPath = path.join(__dirname, '../index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
// Find the main game script block (the large one at the end of the body)
const scripts = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
console.log(`Found ${scripts.length} script blocks.`);

let hasError = false;
scripts.forEach((scriptTag, index) => {
    const code = scriptTag.replace(/<\/?script>/g, '');
    try {
        new Function(code);
        console.log(`Script block ${index + 1}: Syntax OK`);
    } catch (e) {
        console.error(`Script block ${index + 1}: Syntax Error:`, e.message);
        hasError = true;
    }
});

if (hasError) {
    process.exit(1);
} else {
    console.log("All scripts parsed successfully!");
}
