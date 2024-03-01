import {createHash} from "https://deno.land/std@0.80.0/hash/mod.ts";
import fetchProgress from "https://dnascanner.de/functions/deno/fetchprogress.ts";
import {crayon} from "https://deno.land/x/crayon@3.3.3/mod.ts";
import {walkSync} from "https://deno.land/std@0.188.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.197.0/path/mod.ts";

console.error = (text: string) => console.log(crayon.lightRed(text));

let executableName: string = Deno.execPath().replaceAll("\\", "/").split("/").at(-1)?.toLowerCase().split(".")[0] || "";
executableName === "deno" && (executableName = "uniconvert");

const filetypes: Record<string, string[]> = {
	image: ["jpg", "png", "webp", "avif", "thumbnail"],
	audio: ["mp3", "wav", "flac", "m4a", "wma", "aac", "aiff", "ogg"],
	video: ["mp4", "mov", "gif", "mkv", "avi", "wmv", "webm", "m3u8", "hls"],
};

// Examples:
// Single file
// uniconvert video.mp4 m3u8         -> Converts video.mp4 to video.m3u8
// uniconvert video.mp4 gif          -> Converts video.mp4 to video.gif
// uniconvert ./videos/:video mp4    -> Converts all files (fetched via walkSync) in ./videos/ of type-group video to mp4
// uniconvert ./static/:image png    -> Converts all files (fetched via walkSync) in ./static/ of type-group image to png
// uniconvert ./stuff/:mp4 m3u8      -> Converts all files (fetched via walkSync) in ./stuff/ of type mp4 to m3u8
// uniconvert ./collected/:jpg webp  -> Converts all files (fetched via walkSync) in ./collected/ of type jpg to webp
// uniconvert ./:audio mp3           -> Converts all files (fetched via walkSync) in ./ of type audio to mp3
// uniconvert ./nes/ted/:audio mp3   -> Converts all files (fetched via walkSync) in ./nes/ted/ of type audio to mp3

const request = await (async () => {
	// If the second argument (Deno.args[1]) starts with a colon, merge Deno.args[0] and 1 together and for the output take Deno.args[2]
	const input = (Deno.args[0] + (Deno.args[1]?.startsWith(":") ? Deno.args[1] : "")).replaceAll("\\", "/");
	const output = Deno.args[1]?.startsWith(":") ? Deno.args[2] : Deno.args[1];

	if (!input) {
		console.error(`No input file or folder provided. Type "${executableName} --help" for more information`);
		Deno.exit(1);
	}

	switch (input) {
		case "--help":
		case "-h": {
			console.log(`Usage: ${executableName} [options] [source] [target]`);
			console.log();
			console.log("Options:");
			console.log("  -h, --help            Show help message");
			console.log("  -ft, --filetypes      Show a list of supported filetypes");
			console.log("  -u, --upgrade         Upgrade UniConvert to the latest version");
			console.log("  -k, --keep-original   Keep the original file after conversion (default: false)");
			console.log();
			console.log("Examples:");
			console.log(`  ${executableName} test.mp4 hls`);
			console.log("                        Convert 'test.mp4' to 'test.m3u8'");
			console.log(`  ${executableName} ./folder/:image png`);
			console.log("                        Convert all images in 'folder' to 'png'");
			console.log(`  ${executableName} ./folder/:mov mp4`);
			console.log("                        Convert all '.mov' files in 'folder' to 'mp4'");
			console.log(`  ${executableName} ./test.mp3 ogg -k`);
			console.log("                        Convert 'test.mp3' to 'test.ogg' and keep the original file");

			Deno.exit(0);
			break;
		}

		case "--filetypes":
		case "-ft": {
			console.log("Filetypes:");
			for (const filetypeGroup in filetypes) console.log(" " + filetypeGroup + ":", filetypes[filetypeGroup].join(", "));
			Deno.exit(0);
			break;
		}

		case "--upgrade":
		case "-u": {
			if (Deno.execPath().replaceAll("\\", "/").split("/").at(-1)?.toLowerCase() === "deno.exe") {
				console.error("Only available for compiled version");
				Deno.exit(1);
			}

			const temp = true;

			if (temp) {
				console.log("Currently still in development, please check back later");
				Deno.exit(0);
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

				Deno.exit(0);
				break;
			}
		}
	}

	if (!output) {
		console.error(`No output filetype provided. Type "${executableName} --filetypes" for a list of supported filetypes`);
		Deno.exit(1);
	}

	const inputFolderRegex = new RegExp(`^.*\\/:(${Object.values(filetypes).flat().join("|")}|${Object.keys(filetypes).join("|")})\\/?$`);
	const data = {
		input: {
			isFolder: inputFolderRegex.test(input),
			filetype: inputFolderRegex.exec(input)?.[1] || path.extname(input).replaceAll(".", "") || "",
			path: inputFolderRegex.test(input) ? input.split(":").slice(0, -1).join(":") : input,
		},
		output: {
			filetype: output,
		},
		extra: {
			keepOriginal: Deno.args.includes("--keep-original") || Deno.args.includes("-k") || true,
		},
	};

	data.output.filetype === "jpeg" && (data.output.filetype = "jpg");
	data.output.filetype === "hls" && (data.output.filetype = "m3u8");

	if (Object.values(filetypes).flat().includes(data.input.filetype)) {
		for (const filetypeGroup in filetypes) {
			if (filetypes[filetypeGroup].includes(data.input.filetype)) {
				data.input.filetype = filetypeGroup;
				break;
			}
		}
	}

	// If the input filetype is still not a group, it's not supported
	if (!Object.keys(filetypes).includes(data.input.filetype) && !Object.values(filetypes).flat().includes(data.input.filetype)) {
		console.error(`Input filetype not supported (${data.input.filetype})\nType "${executableName} --filetypes" for a list of supported filetypes`);
		Deno.exit(1);
	}

	// If the output filetype is not contained in any group, it's not supported
	if (!Object.values(filetypes).flat().includes(data.output.filetype)) {
		console.error(`Output filetype not supported (${data.output.filetype})\nType "${executableName} --filetypes" for a list of supported filetypes`);
		Deno.exit(1);
	}
	return data;
})();

// Check if the input file exists
try {
	Deno.statSync(request.input.path);
} catch {
	console.error(`Input file or folder not found (${request.input.path})`);
	Deno.exit(1);
}

// Lets do some processing
if (request.input.isFolder) {
	// If request.input.filetype is a group, we need to get all files of that group
	const allowedExtensions = Object.keys(filetypes).includes(request.input.filetype) ? filetypes[request.input.filetype] : [request.input.filetype];

	if (allowedExtensions.includes("jpeg")) allowedExtensions.push("jpg");
	if (allowedExtensions.includes("jpg")) allowedExtensions.push("jpeg");

	// Remove .ts from allowedExtensions
	const tsIndex = allowedExtensions.indexOf("ts");
	if (tsIndex !== -1) allowedExtensions.splice(tsIndex, 1);
	const outIndex = allowedExtensions.indexOf(request.output.filetype);
	if (outIndex !== -1) allowedExtensions.splice(outIndex, 1);

	const files = [...walkSync(request.input.path, {includeDirs: false, exts: allowedExtensions})].map((file) => file.path);

	let processedFiles = 1;
	const totalFiles = files.length;

	console.log("");
	for (const file of files) {
		console.log(`\x1b[1F\x1b[1MCurrent file: ${crayon.yellow(processedFiles)}/${crayon.yellow(totalFiles)}`);

		if (path.extname(file).replaceAll(".", "") === "m3u8" && request.output.filetype !== "m3u8" && request.output.filetype !== "thumbnail") {
			// Convert m3u8 to mp4, for example
			const ffmpegCommand = new Deno.Command("ffmpeg", {cwd: path.dirname(file), args: ["-i", path.basename(file), "-y", "-threads", String(window.navigator.hardwareConcurrency), path.join("..", path.basename(path.dirname(file))) + "." + request.output.filetype]});
			await ffmpegCommand.output();

			// Delete the folder, the inputfile was located in
			if (!request.extra.keepOriginal) Deno.removeSync(path.dirname(file), {recursive: true});
		} else if (request.input.filetype === "image" || request.input.filetype === "audio" || (request.input.filetype === "video" && request.output.filetype !== "m3u8" && request.output.filetype !== "thumbnail")) {
			const ffmpegCommand = new Deno.Command("ffmpeg", {cwd: path.dirname(file), args: ["-i", path.basename(file), "-y", "-threads", String(window.navigator.hardwareConcurrency), `${path.basename(file, path.extname(file))}.${request.output.filetype}`]});
			await ffmpegCommand.output();

			if (!request.extra.keepOriginal) Deno.removeSync(file);
		} else if (request.input.filetype === "video" && request.output.filetype === "m3u8") {
			const folderName = path.join(path.dirname(file), path.basename(file, path.extname(file)));
			Deno.mkdirSync(folderName, {recursive: true});

			const ffmpegCommand = new Deno.Command("ffmpeg", {cwd: folderName, args: ["-i", path.join("..", path.basename(file)), "-codec:", "copy", "-start_number", "0", "-hls_time", "3", "-hls_list_size", "0", "-f", "hls", "-threads", String(window.navigator.hardwareConcurrency), "-y", "segment-.m3u8"]});
			await ffmpegCommand.output();

			Deno.renameSync(path.join(folderName, "segment-.m3u8"), path.join(folderName, "master.m3u8"));

			if (!request.extra.keepOriginal) Deno.removeSync(file);
		} else if (request.input.filetype === "video" && path.extname(file).replaceAll(".", "") === "m3u8" && request.output.filetype === "thumbnail") {
			try {
				Deno.statSync(path.join(path.dirname(file), "thumbnail.png"));
				processedFiles++;
				continue;
			} catch {
				null;
			}

			const ffmpegCommand = new Deno.Command("ffmpeg", {cwd: path.dirname(file), args: ["-i", path.basename(file), "-y", "-threads", String(window.navigator.hardwareConcurrency), "-vframes", "1", "-vf", "thumbnail=256", "thumbnail.png"]});
			await ffmpegCommand.output();
		} else if (request.input.filetype === "video" && request.output.filetype === "thumbnail") {
			// If the output filetype is thumbnail, save the thumbnail as <video-name>.png
			const ffmpegCommand = new Deno.Command("ffmpeg", {cwd: path.dirname(file), args: ["-i", path.basename(file), "-y", "-threads", String(window.navigator.hardwareConcurrency), "-vframes", "1", "-vf", "thumbnail=256", `${path.basename(file, path.extname(file))}.png`]});
			await ffmpegCommand.output();
		}

		processedFiles++;
	}
} else {
	// Skip file if its already in output format
	if (path.extname(request.input.path).replaceAll(".", "") === request.output.filetype) {
		console.log(crayon.green("File already in output format"));
		Deno.exit(0);
	}

	if (request.input.filetype === "image" || request.input.filetype === "audio" || (request.input.filetype === "video" && request.output.filetype !== "m3u8" && request.output.filetype !== "thumbnail")) {
		const ffmpegCommand = new Deno.Command("ffmpeg", {cwd: path.dirname(request.input.path), args: ["-i", path.basename(request.input.path), "-y", "-threads", String(window.navigator.hardwareConcurrency), `${path.basename(request.input.path, path.extname(request.input.path))}.${request.output.filetype}`]});
		await ffmpegCommand.output();

		if (!request.extra.keepOriginal) Deno.removeSync(request.input.path);
	} else if (request.input.filetype === "video" && request.output.filetype === "m3u8") {
		const folderName = path.join(path.dirname(request.input.path), path.basename(request.input.path, path.extname(request.input.path)));
		Deno.mkdirSync(folderName, {recursive: true});

		const ffmpegCommand = new Deno.Command("ffmpeg", {cwd: folderName, args: ["-i", path.join("..", path.basename(request.input.path)), "-codec:", "copy", "-start_number", "0", "-hls_time", "3", "-hls_list_size", "0", "-f", "hls", "-threads", String(window.navigator.hardwareConcurrency), "-y", "segment-.m3u8"]});
		await ffmpegCommand.output();

		Deno.renameSync(path.join(folderName, "segment-.m3u8"), path.join(folderName, "master.m3u8"));

		if (!request.extra.keepOriginal) Deno.removeSync(request.input.path);
	} else if (request.input.filetype === "video" && path.extname(request.input.path).replaceAll(".", "") === "m3u8" && request.output.filetype === "thumbnail") {
		const ffmpegCommand = new Deno.Command("ffmpeg", {cwd: path.dirname(request.input.path), args: ["-i", path.basename(request.input.path), "-y", "-threads", String(window.navigator.hardwareConcurrency), "-vframes", "1", "-vf", "thumbnail=256", "thumbnail.png"]});
		await ffmpegCommand.output();
	} else if (request.input.filetype === "video" && request.output.filetype === "thumbnail") {
		// If the output filetype is thumbnail, save the thumbnail as <video-name>.png
		const ffmpegCommand = new Deno.Command("ffmpeg", {cwd: path.dirname(request.input.path), args: ["-i", path.basename(request.input.path), "-y", "-threads", String(window.navigator.hardwareConcurrency), "-vframes", "1", "-vf", "thumbnail=256", `${path.basename(request.input.path, path.extname(request.input.path))}.png`]});
		await ffmpegCommand.output();
	}
}

// switch (filetype) {
// 	case "image": {
// 		try {
// 			const ffmpegCommand = new Deno.Command("ffmpeg", {args: ["-i", filename, "-y", "-threads", String(window.navigator.hardwareConcurrency), `${path.join(path.dirname(filename), path.basename(filename, path.extname(filename)))}.${outFiletype}`]});
// 			await ffmpegCommand.output();
// 		} catch {
// 			console.error("FFmpeg not found or fileformat not supported, please install ffmpeg.exe to PATH");
// 			Deno.exit(1);
// 		}
// 		break;
// 	}

// 	case "audio": {
// 		try {
// 			// Use all cpu cores => window.navigator.hardwareConcurrency.
// 			const ffmpegCommand = new Deno.Command("ffmpeg", {args: ["-i", filename, "-y", "-threads", String(window.navigator.hardwareConcurrency), `${path.join(path.dirname(filename), path.basename(filename, path.extname(filename)))}.${outFiletype}`]});
// 			await ffmpegCommand.output();
// 		} catch {
// 			console.error("FFmpeg not found or fileformat not supported, please install ffmpeg.exe to PATH");
// 			Deno.exit(1);
// 		}
// 		break;
// 	}

// 	case "video": {
// 		if (outFiletype !== "m3u8") {
// 			try {
// 				const ffmpegCommand = new Deno.Command("ffmpeg", {args: ["-i", filename, "-y", "-threads", String(window.navigator.hardwareConcurrency), `${path.join(path.dirname(filename), path.basename(filename, path.extname(filename)))}.${outFiletype}`]});
// 				await ffmpegCommand.output();
// 			} catch {
// 				console.error("FFmpeg not found, please install ffmpeg to PATH");
// 				Deno.exit(1);
// 			}
// 		} else {
// 			const folderName = path.join(path.dirname(filename), path.basename(filename, path.extname(filename)));
// 			Deno.mkdirSync(folderName, {recursive: true});

// 			try {
// 				const ffmpegCommand = new Deno.Command("ffmpeg", {args: ["-i", filename, "-codec:", "copy", "-start_number", "0", "-hls_time", "3", "-hls_list_size", "0", "-f", "hls", "-threads", String(window.navigator.hardwareConcurrency), "-y", path.join(folderName, "segment-.m3u8")]});
// 				await ffmpegCommand.output();

// 				Deno.renameSync(path.join(folderName, "segment-.m3u8"), path.join(folderName, "master.m3u8"));
// 			} catch {
// 				console.error("FFmpeg not found, please install ffmpeg to PATH");
// 				Deno.exit(1);
// 			}
// 		}
// 		break;
// 	}
// }

console.log(crayon.green("Done!"));
