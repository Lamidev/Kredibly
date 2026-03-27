const { execSync } = require('child_process');
const commits = execSync('git log --format=%H frontend/src/pages/public/landing-page.jsx').toString().split('\n').filter(Boolean);
for (const c of commits) {
    const content = execSync(`git show ${c}:frontend/src/pages/public/landing-page.jsx`).toString();
    const start = content.indexOf('Mission Map Section');
    if (start > -1) {
        const end = content.indexOf('</section>', start);
        console.log('FOUND IN ' + c);
        console.log(content.slice(start - 20, end + 10));
        break;
    }
}
