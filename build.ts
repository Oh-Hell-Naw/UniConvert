import { createHash } from "https://deno.land/std@0.80.0/hash/mod.ts";
import { crayon } from "https://deno.land/x/crayon@3.3.3/mod.ts";

const { stdout, stderr } = new Deno.Command("wincompile.cmd", { args: [`--Icon=.\\Logo\\uniconvert.ico`, `--FileDescription=UniConvert`, `--FileVersion=2.5.0`, `--LegalCopyright=\xa9 OhHellNaw`, `--OriginalFilename=uniconvert.exe`, `--ProductName=UniConvert`, `--ProductVersion=2.3.0`, `--`, `-A`, `--unstable`, `main.ts`], stdout: "piped", stderr: "piped" }).outputSync();

if (stdout.length) console.log(new TextDecoder().decode(stdout));
if (stderr.length) console.log(new TextDecoder().decode(stderr));

const hash = createHash("sha256");
const file = await Deno.open("uniconvert.exe");
// deno-lint-ignore no-deprecated-deno-api
for await (const chunk of Deno.iter(file)) hash.update(chunk);
const currentHash = hash.toString().toUpperCase();
Deno.close(file.rid);

Deno.writeTextFileSync("hash.json", JSON.stringify({ hash: currentHash }));

console.log(crayon.green("Done!"));
