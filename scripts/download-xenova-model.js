import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";

const argv = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [k, v] = arg.split("=");
  return [k.replace(/^--/, ""), v ?? true];
}));

const repo = argv.repo || "sentence-transformers/all-MiniLM-L6-v2";
const outDir = argv.out || "public/models/all-MiniLM-L6-v2";
const filesWhitelist = argv.files ? String(argv.files).split(",").map((s) => s.trim()).filter(Boolean) : null;

async function mkdirp(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function listRepoFiles(repoName) {
  const apiUrl = `https://huggingface.co/api/models/${repoName}/tree/main`;
  const res = await fetch(apiUrl, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Failed to list files: ${res.status} ${res.statusText}`);
  return res.json();
}

async function downloadFile(repoName, filePath, dest) {
  const url = `https://huggingface.co/${repoName}/resolve/main/${filePath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${filePath}: ${res.status} ${res.statusText}`);
  await pipeline(res.body, fs.createWriteStream(dest));
}

async function main() {
  console.log(`Listing files for ${repo}...`);
  const tree = await listRepoFiles(repo);
  let files = tree.filter((f) => f.type === "file");
  if (filesWhitelist) {
    const set = new Set(filesWhitelist);
    files = files.filter((f) => set.has(f.path) || set.has(path.basename(f.path)));
    if (files.length === 0) {
      console.log(`No matching files found for whitelist: ${filesWhitelist.join(",")}`);
      return;
    }
  }
  if (files.length === 0) {
    console.log("No files found in repo tree. Exiting.");
    return;
  }

  await mkdirp(outDir);

  for (const f of files) {
    const destPath = path.join(outDir, f.path);
    await mkdirp(path.dirname(destPath));
    try {
      console.log(`Downloading ${f.path} -> ${path.relative(process.cwd(), destPath)}`);
      await downloadFile(repo, f.path, destPath);
    } catch (err) {
      console.error(`Error downloading ${f.path}:`, err.message);
    }
  }

  console.log(`All files attempted. Check ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
