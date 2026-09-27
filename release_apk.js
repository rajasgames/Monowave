const fs = require("fs");
const crypto = require("crypto");
const https = require("https");
const path = require("path");

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY || "rajasgames/Monowave";

// Resolve APK path relative to project root
const defaultApkPath = path.resolve(
  __dirname,
  "android",
  "app",
  "build",
  "outputs",
  "apk",
  "release",
  "app-release.apk",
);

const apkPath = process.env.APK_PATH || defaultApkPath;

if (!token) {
  console.error("Error: GITHUB_TOKEN environment variable is required.");
  process.exit(1);
}

if (!fs.existsSync(apkPath)) {
  console.error(`Error: Release APK not found at: ${apkPath}`);
  console.error("Run a release build first.");
  process.exit(1);
}

function calculateSha256(filePath) {
  const hash = crypto.createHash("sha256");
  const fileBuffer = fs.readFileSync(filePath);
  hash.update(fileBuffer);
  return hash.digest("hex");
}

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body || "{}"));
        } else {
          reject(
            new Error(`Request failed with status ${res.statusCode}: ${body}`),
          );
        }
      });
    });
    req.on("error", reject);
    if (data) {
      if (Buffer.isBuffer(data) || typeof data === "string") {
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
    const appJsonPath = path.resolve(__dirname, "app.json");
    const appConfig = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
    const version = appConfig.expo?.version || "1.0.0";
    const tagName = `v${version}`;

    console.log(`Calculating SHA-256 for ${apkPath}...`);
    const sha256 = calculateSha256(apkPath);
    const stats = fs.statSync(apkPath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`APK Size: ${sizeMb} MB`);
    console.log(`SHA-256: ${sha256}`);

    console.log(`Creating GitHub release ${tagName}...`);
    const releaseData = {
      tag_name: tagName,
      name: `Monowave v${version}`,
      body: [
        `## Monowave v${version}`,
        "",
        "### Verification & Checksums",
        `- **File**: \`monowave-universal.apk\``,
        `- **Size**: ${sizeMb} MB`,
        `- **SHA-256**: \`${sha256}\``,
        "",
        "### Notes",
        "- Local-first, privacy-respecting audio player",
        "- Native NewPipe extraction with background playback",
        "- Production signed release",
      ].join("\n"),
    };

    const release = await request(
      {
        hostname: "api.github.com",
        path: `/repos/${repo}/releases`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "Monowave-Release-Tool",
          "Content-Type": "application/json",
        },
      },
      releaseData,
    );

    console.log(`Release created: ${release.html_url || release.id}`);
    const uploadUrlMatch = release.upload_url.match(
      /^(https:\/\/[^\/]+)(\/.*)\{/,
    );
    const host = uploadUrlMatch[1].replace("https://", "");
    const pathUrl = uploadUrlMatch[2] + "?name=monowave-universal.apk";

    console.log("Uploading APK to release assets...");
    const apkData = fs.readFileSync(apkPath);

    await request(
      {
        hostname: host,
        path: pathUrl,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "Monowave-Release-Tool",
          "Content-Type": "application/vnd.android.package-archive",
          "Content-Length": apkData.length,
        },
      },
      apkData,
    );

    console.log("Upload successful!");
  } catch (e) {
    console.error("Error publishing release:", e);
    process.exit(1);
  }
}

publish();
