const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'sosab-fe', 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

// Make sure directories exist
if (!fs.existsSync(PUBLIC_DIR)) {
    console.error('Error: Public directory does not exist at:', PUBLIC_DIR);
    process.exit(1);
}
if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// 1. Copy icon-192.png to logo.png
const srcIcon = path.join(PUBLIC_DIR, 'icon-192.png');
const destLogo = path.join(PUBLIC_DIR, 'logo.png');
if (fs.existsSync(srcIcon)) {
    fs.copyFileSync(srcIcon, destLogo);
    console.log('Successfully copied icon-192.png to logo.png');
} else {
    console.warn('Warning: icon-192.png not found, cannot copy to logo.png');
}

// 2. SVG designs
const badgeSvg = `
<svg width="96" height="96" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M14 6a6 6 0 0 1 6 6v3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M4 15v-3a6 6 0 0 1 6-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <rect x="2" y="15" width="20" height="4" rx="1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>
`;

const categories = {
    security: {
        color: '#4f46e5', // Deep Indigo
        path: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
    },
    attendance: {
        color: '#10b981', // Emerald Green
        path: `
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <line x1="16" y1="2" x2="16" y2="6" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <line x1="8" y1="2" x2="8" y2="6" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <line x1="3" y1="10" x2="21" y2="10" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="m9 16 2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        `
    },
    stock: {
        color: '#f97316', // Orange
        path: `
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <line x1="12" y1="9" x2="12" y2="13" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <line x1="12" y1="17" x2="12.01" y2="17" stroke="white" stroke-width="2" stroke-linecap="round"/>
        `
    },
    salary: {
        color: '#059669', // Dark Green
        path: `
          <rect x="2" y="6" width="20" height="12" rx="2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="12" cy="12" r="2" stroke="white" stroke-width="2"/>
          <path d="M6 12h.01M18 12h.01" stroke="white" stroke-width="2" stroke-linecap="round"/>
        `
    },
    report: {
        color: '#3b82f6', // Blue
        path: `
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M14 2v4a2 2 0 0 0 2 2h4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 9H8" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M16 13H8" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M16 17H8" stroke="white" stroke-width="2" stroke-linecap="round"/>
        `
    },
    task: {
        color: '#8b5cf6', // Purple
        path: `
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M9 12h6" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M9 16h6" stroke="white" stroke-width="2" stroke-linecap="round"/>
        `
    }
};

async function generateAssets() {
    console.log('Launching Puppeteer browser...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Generate badge.png (96x96)
    console.log('Generating badge.png...');
    await page.setViewport({ width: 96, height: 96 });
    await page.setContent(`
        <html>
        <head>
            <style>
                body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
                svg { display: block; width: 96px; height: 96px; }
            </style>
        </head>
        <body>
            ${badgeSvg}
        </body>
        </html>
    `);
    const badgeDest = path.join(PUBLIC_DIR, 'badge.png');
    await page.screenshot({ path: badgeDest, omitBackground: true });
    console.log('Saved badge.png to:', badgeDest);

    // Generate category icons (192x192)
    await page.setViewport({ width: 192, height: 192 });
    for (const [name, config] of Object.entries(categories)) {
        console.log(`Generating category icon: ${name}.png...`);
        await page.setContent(`
            <html>
            <head>
                <style>
                    body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
                    .icon-container {
                        width: 192px;
                        height: 192px;
                        background-color: ${config.color};
                        border-radius: 46px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    svg {
                        width: 110px;
                        height: 110px;
                    }
                </style>
            </head>
            <body>
                <div class="icon-container">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        ${config.path}
                    </svg>
                </div>
            </body>
            </html>
        `);
        const iconDest = path.join(ICONS_DIR, `${name}.png`);
        await page.screenshot({ path: iconDest, omitBackground: true });
        console.log(`Saved ${name}.png to:`, iconDest);
    }

    await browser.close();
    console.log('All notification assets generated successfully!');
}

generateAssets().catch(err => {
    console.error('Error generating assets:', err);
    process.exit(1);
});
