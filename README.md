# UniConvert by [Fabik](https://github.com/LegendFabix) and [DNA](https://github.com/DNAScanner)

G'day,
this is a small project Fabik and I made just for fun, which allows you to easily convert images, audio files and videos right in your terminal. Written in TypeScript with [Deno](https://deno.land/)

## How to use

General usage:

```bash
uniconvert.exe <path to image> <output format, e.g. png, jpg, mp4, etc.>
```

-> converts file to given output format.

Show help:

```bash
uniconvert.exe --help
```

Show supported filetypes:

```bash
uniconvert.exe --filetypes
```

Check for updates: (Feature still in development)

```bash
uniconvert.exe --upgrade
```

## How to install

- Install [FFmpeg](https://github.com/BtbN/FFmpeg-Builds/releases) to PATH.
- Install [Uniconvert](https://github.com/DNAScanner/UniConvert) (to PATH).

## Compiling

To compile main.ts install [wincompile](https://github.com/Leokuma/wincompile):

```bash
deno install -f --allow-env=DENO_DIR,LOCALAPPDATA --allow-net=raw.githubusercontent.com/Leokuma/wincompile --allow-read --allow-write --allow-run https://deno.land/x/wincompile/wincompile.ts
```

and run build.ts:

```bash
deno run -A build.ts
```
