const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const args = process.argv.slice(2);
const targetPath = args[0];
const qualityArgIndex = args.indexOf('--quality');
const outputArgIndex = args.indexOf('--output');
const keepOriginals = args.includes('--keep');
const quality = qualityArgIndex !== -1 ? Number(args[qualityArgIndex + 1]) : 80;
const outputDir = outputArgIndex !== -1 ? args[outputArgIndex + 1] : null;

if (!targetPath) {
  console.error('Uso: node scripts/convert-images-to-webp.js <ruta> [--quality 80] [--output <dir>] [--keep]');
  process.exit(1);
}

const supportedExts = new Set(['.jpg', '.jpeg', '.png']);

function isFile(p) {
  return fs.statSync(p).isFile();
}

function isDir(p) {
  return fs.statSync(p).isDirectory();
}

function listFiles(dir) {
  const entries = fs.readdirSync(dir);
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry);
    if (isDir(full)) return listFiles(full);
    return [full];
  });
}

async function convertFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!supportedExts.has(ext)) return null;

  const baseName = path.basename(filePath, ext) + '.webp';
  const outputBase = outputDir ? outputDir : path.dirname(filePath);
  const outputPath = path.join(outputBase, baseName);

  await fs.promises.mkdir(outputBase, { recursive: true });

  await sharp(filePath)
    .webp({ quality })
    .toFile(outputPath);

  if (!keepOriginals) {
    await fs.promises.unlink(filePath);
  }

  return outputPath;
}

async function run() {
  const resolvedPath = path.resolve(targetPath);
  const files = isDir(resolvedPath) ? listFiles(resolvedPath) : [resolvedPath];
  let converted = 0;

  for (const file of files) {
    try {
      const result = await convertFile(file);
      if (result) {
        converted += 1;
        console.log(`OK: ${file} -> ${result}`);
      }
    } catch (err) {
      console.warn(`ERROR: ${file} -> ${err.message || err}`);
    }
  }

  console.log(`Listo. Convertidos: ${converted}`);
}

run();
