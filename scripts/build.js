
const fs = require("node:fs");
const path = require("node:path");

const sourceDirectory = path.join(__dirname, "..", "src");
const outputDirectory = path.join(__dirname, "..", "dist");

if (!fs.existsSync(sourceDirectory)) {
  throw new Error("Source directory 'src' was not found.");
}

fs.rmSync(outputDirectory, { recursive: true, force: true });

fs.cpSync(sourceDirectory, outputDirectory, {
  recursive: true,
});

console.log("Build completed successfully. Website files copied to dist.");
