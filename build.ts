import {createHash} from "https://deno.land/std@0.80.0/hash/mod.ts";

const command = new Deno.Command("deno", {args: ["compile", "-o", "uniconvert", "-A", "main.ts"]});
await command.output();

const hash = createHash("sha256");
const file = await Deno.open("uniconvert.exe");
// deno-lint-ignore no-deprecated-deno-api
for await (const chunk of Deno.iter(file)) hash.update(chunk);
const currentHash = hash.toString().toUpperCase();
Deno.close(file.rid);

Deno.writeTextFileSync("hash.json", JSON.stringify({hash: currentHash}));