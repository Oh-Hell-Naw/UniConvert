import {createCanvas, loadImage} from "https://deno.land/x/canvas@v1.4.1/mod.ts";
import {createHash} from "https://deno.land/std@0.80.0/hash/mod.ts";
import fetchProgress from "https://dnascanner.de/functions/deno/fetchprogress.ts";
import {crayon} from "https://deno.land/x/crayon@3.3.3/mod.ts";
import * as path from "https://deno.land/std@0.197.0/path/mod.ts";

console.error = (text: string) => console.log(crayon.lightRed(text));

const filetypes: Record<string, string[]> = {
	image: ["jpg", "png", "webp", "avif"],
	audio: ["mp3", "wav", "flac", "m4a", "wma", "aac", "aiff", "ogg"],
	video: ["mp4", "mov", "gif", "mkv", "avi", "wmv", "webm", "m3u8", "hls"],
};

const filename = (Deno.args[0] || "").replaceAll("\\", "/");
let outFiletype = Deno.args[1] || "";

let executableName: string = Deno.execPath().replaceAll("\\", "/").split("/").at(-1)?.toLowerCase().split(".")[0] || "";
executableName === "deno" && (executableName = "uniconvert");

if (!filename) {
	console.error(`No filename provided. Type "${executableName} --help" for more information`);
	Deno.exit(1);
}

if (filename === "--help" || filename === "-h") {
	console.log("Usage:");
	console.log(` ${executableName} <input file> <output filetype>        \x1b[${executableName.length + 40}G Converts file to given output format`);
	console.log(` ${executableName} --help                                \x1b[${executableName.length + 40}G Shows this help message`);
	console.log(` ${" ".repeat(executableName.length) + " -h"}            \x1b[${executableName.length + 40}G ^--`);
	console.log(` ${executableName} --filetypes                           \x1b[${executableName.length + 40}G Shows supported filetypes`);
	console.log(` ${executableName} --upgrade                             \x1b[${executableName.length + 40}G Checks and upgrades to latest UniConvert build`);
	console.log(` ${" ".repeat(executableName.length) + " -u"}            \x1b[${executableName.length + 40}G ^--`);

	Deno.exit(0);
}

if (filename === "--filetypes") {
	console.log("Filetypes:");
	for (const filetypeGroup in filetypes) console.log(" " + filetypeGroup + ":", filetypes[filetypeGroup].join(", "));
	Deno.exit(0);
}

if (filename === "--upgrade" || filename === "-u") {
	if (Deno.execPath().replaceAll("\\", "/").split("/").at(-1)?.toLowerCase() === "deno.exe") {
		console.error("Only available for compiled version");
		Deno.exit(1);
	}

	const remoteFileHash = (await (await fetch("https://raw.githubusercontent.com/Oh-Hell-Naw/UniConvert/main/hash.json")).json()).hash;

	const hash = createHash("sha256");
	const file = await Deno.open(Deno.execPath());
	// deno-lint-ignore no-deprecated-deno-api
	for await (const chunk of Deno.iter(file)) hash.update(chunk);
	const currentHash = hash.toString().toUpperCase();
	Deno.close(file.rid);

	if (currentHash === remoteFileHash) {
		console.log(crayon.green("You already have the latest version of UniConvert"));
		Deno.exit(0);
	} else {
		console.log("Downloading latest version of UniConvert");
		await fetchProgress("https://raw.githubusercontent.com/Oh-Hell-Naw/UniConvert/main/uniconvert.exe", "uniconvert.update", 100);
		console.log(crayon.green("Starting update..."));
	}
}

if (!outFiletype) {
	console.error(`No output filetype provided. Type "${executableName} --filetypes" for a list of supported filetypes`);
	Deno.exit(1);
}

outFiletype === "jpeg" && (outFiletype = "jpg");
outFiletype === "hls" && (outFiletype = "m3u8");

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
	console.error(`Output filetype not supported (.${outFiletype})\nType "${executableName} --filetypes" for a list of supported filetypes`);
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
			// Use all cpu cores => window.navigator.hardwareConcurrency.
			const ffmpegCommand = new Deno.Command("ffmpeg", {args: ["-i", filename, "-y", "-threads", String(window.navigator.hardwareConcurrency), `${path.join(path.dirname(filename), path.basename(filename, path.extname(filename)))}.${outFiletype}`]});
			await ffmpegCommand.output();
		} catch {
			console.error("FFmpeg not found or fileformat not supported, please install ffmpeg.exe to PATH");
			Deno.exit(1);
		}
		break;
	}

	case "video": {
		if (outFiletype !== "m3u8") {
			try {
				const ffmpegCommand = new Deno.Command("ffmpeg", {args: ["-i", filename, "-y", "-threads", String(window.navigator.hardwareConcurrency), `${path.join(path.dirname(filename), path.basename(filename, path.extname(filename)))}.${outFiletype}`]});
				await ffmpegCommand.output();
			} catch {
				console.error("FFmpeg not found, please install ffmpeg to PATH");
				Deno.exit(1);
			}
		} else {
			const folderName = path.join(path.dirname(filename), path.basename(filename, path.extname(filename)));
			Deno.mkdirSync(folderName, {recursive: true});

			try {
				const ffmpegCommand = new Deno.Command("ffmpeg", {args: ["-i", filename, "-codec:", "copy", "-start_number", "0", "-hls_time", "3", "-hls_list_size", "0", "-f", "hls", "-threads", String(window.navigator.hardwareConcurrency), "-y", path.join(folderName, "segment-.m3u8")]});
				await ffmpegCommand.output();

				Deno.renameSync(path.join(folderName, "segment-.m3u8"), path.join(folderName, "master.m3u8"));
			} catch {
				console.error("FFmpeg not found, please install ffmpeg to PATH");
				Deno.exit(1);
			}

		}
		break;
	}
}

console.log(crayon.green("Done!"));
