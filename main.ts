import {createCanvas, loadImage} from "https://deno.land/x/canvas@v1.4.1/mod.ts";
import {ffmpeg} from "https://deno.land/x/deno_ffmpeg@v3.1.0/mod.ts";
import * as path from "https://deno.land/std@0.197.0/path/mod.ts";

const filetypes: Record<string, string[]> = {
	image: ["jpg", "png", "webp", "avif"],
	audio: ["mp3", "wav", "flac", "m4a", "wma", "aac", "aiff", "ogg"],
	video: ["mp4", "mov", "gif", "mkv", "avi", "wmv", "webm", "avchd", "3gp"],
};

const filename = (Deno.args[0] || "").replaceAll("\\", "/");
let outFiletype = Deno.args[1] || "";

if (!filename) {
	console.log("No filename provided");
	Deno.exit(1);
}

if (!outFiletype) {
	console.log("No output filetype provided");
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
	console.error(`Output filetype not supported (.${outFiletype})`);
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
	console.error(`Filetype not supported (.${filename.split(".").pop()})`);
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
			const ffmpegProcess = ffmpeg({input: filename, ffmpegDir: "ffmpeg.exe"});
			ffmpegProcess.save(path.join(path.dirname(filename), `${path.basename(filename, path.extname(filename))}.${outFiletype}`));
		} catch {
			console.error("FFmpeg not found, please install ffmpeg.exe to PATH or into this directory");
			Deno.exit(1);
		}
		break;
	}

	case "video": {
		try {
			const ffmpegProcess = ffmpeg({input: filename, ffmpegDir: "ffmpeg.exe"});
			ffmpegProcess.save(path.join(path.dirname(filename), `${path.basename(filename, path.extname(filename))}.${outFiletype}`));
		} catch {
			console.error("FFmpeg not found, please install ffmpeg.exe to PATH or into this directory");
			Deno.exit(1);
		}
		break;
	}
}
