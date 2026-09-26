const fs = require('fs');
const https = require('https');
const path = require('path');

const token = process.env.GITHUB_TOKEN;
const repo = 'rajasgames/Monowave';
const apkPath = path.join('c:', 'Users', 'rajag.RAJA', 'Desktop', 'Antigravity', 'Monowave', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(body));
                } else {
                    reject(new Error(`Request failed with status ${res.statusCode}: ${body}`));
                }
            });
        });
        req.on('error', reject);
        if (data) {
            if (Buffer.isBuffer(data) || typeof data === 'string') {
                req.write(data);
            } else {
                req.write(JSON.stringify(data));
            }
        }
        req.end();
    });
}

async function publish() {
    try {
        console.log('Creating release...');
        const releaseData = {
            tag_name: 'v1.0.0',
            name: 'Monowave v1.0.0',
            body: 'Open source release of Monowave with a premium UI, local recommendations, custom Phosphor icons, and native hardware back-button support.',
        };
        const release = await request({
            hostname: 'api.github.com',
            path: `/repos/${repo}/releases`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'Node.js',
                'Content-Type': 'application/json'
            }
        }, releaseData);

        console.log(`Release created: ${release.upload_url}`);
        const uploadUrlMatch = release.upload_url.match(/^(https:\/\/[^\/]+)(\/.*)\{/);
        const host = uploadUrlMatch[1].replace('https://', '');
        const pathUrl = uploadUrlMatch[2] + '?name=Monowave.apk';

        console.log('Reading APK file...');
        const apkData = fs.readFileSync(apkPath);

        console.log('Uploading APK...');
        await request({
            hostname: host,
            path: pathUrl,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'Node.js',
                'Content-Type': 'application/vnd.android.package-archive',
                'Content-Length': apkData.length
            }
        }, apkData);

        console.log('Upload successful!');
    } catch (e) {
        console.error('Error publishing release:', e);
    }
}

publish();
