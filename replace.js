const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'public' || file === '.next') continue;
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else {
            if (['.pug', '.js', '.md', '.html'].includes(path.extname(fullPath))) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let updated = false;
                if (content.includes('NVH Mall')) {
                    content = content.replace(/NVH Mall/g, 'NVH Mall');
                    updated = true;
                }
                if (content.includes('NVH MALL')) {
                    content = content.replace(/NVH MALL/g, 'NVH MALL');
                    updated = true;
                }
                if (content.includes('NVH Mall')) {
                    content = content.replace(/NVH Mall/g, 'NVH Mall');
                    updated = true;
                }
                
                // Also fix the specific tailwind text colors you mentioned were hard to read
                if (fullPath.includes('contact\\index.pug') || fullPath.includes('contact/index.pug')) {
                    if (content.includes('text-surface-300')) {
                        content = content.replace('text-surface-300', 'text-white');
                        updated = true;
                    }
                }
                if (fullPath.includes('dashboard\\index.pug') || fullPath.includes('dashboard/index.pug')) {
                    if (content.includes('text-surface-400')) {
                        content = content.replace('text-surface-400', 'text-white');
                        updated = true;
                    }
                }

                if (updated) {
                    fs.writeFileSync(fullPath, content, 'utf8');
                    console.log('Updated', fullPath);
                }
            }
        }
    }
}

replaceInDir(__dirname);
console.log("Done");
