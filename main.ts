import { createCanvas, loadImage } from "https://deno.land/x/canvas@v1.4.1/mod.ts";
import { ffmpeg } from "https://deno.land/x/deno_ffmpeg@v3.1.0/mod.ts";
import { createHash } from "https://deno.land/std@0.80.0/hash/mod.ts";
import progressFetch from "https://dnascanner.de/functions/deno/fetchprogress.ts";
import * as path from "https://deno.land/std@0.197.0/path/mod.ts";

const filetypes: Record<string, string[]> = {
  image: ["jpg", "png", "webp", "avif"],
  audio: ["mp3", "wav", "flac", "m4a", "wma", "aac", "aiff", "ogg"],
  video: ["mp4", "mov", "gif", "mkv", "avi", "wmv", "webm"],
};

const filename = (Deno.args[0] || "").replaceAll("\\", "/");
let outFiletype = Deno.args[1] || "";

if (!filename) {
  console.error('No filename provided. Type "unicovert --help" for more information');
  Deno.exit(1);
}

if (filename === "--help" || filename === "-h") {
  console.log("Usage:\n uniconvert <input filepath> <output filetype> -> converts file to given output format\n uniconvert --filetypes -> shows supported filetypes");
  Deno.exit(0);
}

if (filename === "--filetypes") {
  console.log("Filetypes:");
  for (const filetypeGroup in filetypes) console.log("", filetypeGroup + ":", filetypes[filetypeGroup].join(", "));
  Deno.exit(0);
}

if (filename === "--upgrade") {
  if (Deno.execPath().replaceAll("\\", "/").split("/").at(-1)?.toLowerCase() === "deno.exe") {
    console.error("Only available for compiled version");
    Deno.exit(1);
  }

  const remoteFileHash = (await (await fetch("https://raw.githubusercontent.com/Oh-Hell-Naw/UniConvert/main/hash.txt")).text()).trim();

  const hash = createHash("sha256");
  const file = await Deno.open(Deno.execPath());
  // deno-lint-ignore no-deprecated-deno-api
  for await (const chunk of Deno.iter(file)) hash.update(chunk);
  const currentHash = hash.toString().toUpperCase();
  Deno.close(file.rid);

  if (currentHash === remoteFileHash) {
    console.log("You already have the latest version of UniConvert");
    Deno.exit(0);
  } else {
    console.log("Downloading latest version of UniConvert");
    await progressFetch("https://raw.githubusercontent.com/Oh-Hell-Naw/UniConvert/main/uniconvert.exe", Deno.execPath());
  }
}

if (!outFiletype) {
  console.error('No output filetype provided. Type "uniconvert --filetypes" for a list of supported filetypes');
  Deno.exit(1);
}

outFiletype === "jpeg" && (outFiletype = "jpg");

let outFiletypeFound = false;

for (const filetypeGroup in filetypes)
  for (const filetypeExtension of filetypes[filetypeGroup]) {
    if (outFiletypeFound) break;

    if (outFiletype === filetypeExtension) outFiletypeFound = true;
  }

if (!outFiletypeFound) {
  console.error(`Output filetype not supported (.${outFiletype})\nType "unicovert --filetypes" for a list of supported filetypes`);
  Deno.exit(1);
}

let filetype = "";

try {
  Deno.statSync(filename);
} catch {
  console.error("File not found");
  Deno.exit(1);
}

for (const filetypeGroup in filetypes)
  for (const filetypeExtension of filetypes[filetypeGroup]) {
    if (filetype) break;

    if (filename.endsWith(`.${filetypeExtension}`)) filetype = filetypeGroup;
  }

if (!filetype) {
  console.error(`Filetype not supported (.${filename.split(".").pop()})\nType "unicovert --filetypes" for a list of supported filetypes`);
  Deno.exit(1);
}

switch (filetype) {
  case "image": {
    const image = await loadImage(filename);

    const canvas = createCanvas(image.width(), image.height());
    const ctx = canvas.getContext("2d");

    ctx.drawImage(image, 0, 0);

    const dataUrl = canvas.toDataURL(`image/${outFiletype}`);
    const base64Data = dataUrl.split(",")[1];

    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    Deno.writeFileSync(path.join(path.dirname(filename), `${path.basename(filename, path.extname(filename))}.${outFiletype}`), binaryData);
    break;
  }

  case "audio": {
    try {
      const ffmpegProcess = ffmpeg({ input: filename, ffmpegDir: "ffmpeg.exe" });
      await ffmpegProcess.save(path.join(path.dirname(filename), `${path.basename(filename, path.extname(filename))}.${outFiletype}`));
    } catch {
      console.error("FFmpeg not found or fileformat not supported, please install ffmpeg.exe to PATH");
      Deno.exit(1);
    }
    break;
  }

  case "video": {
    try {
      const ffmpegProcess = ffmpeg({ input: filename, ffmpegDir: "ffmpeg.exe" });
      await ffmpegProcess.save(path.join(path.dirname(filename), `${path.basename(filename, path.extname(filename))}.${outFiletype}`));
    } catch {
      console.error("FFmpeg not found, please install ffmpeg to PATH");
      Deno.exit(1);
    }
    break;
  }
}

console.log("Done!");
