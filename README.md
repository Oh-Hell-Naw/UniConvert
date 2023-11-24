# UniConvert by DNA and [Fabik](https://github.com/LegendFabix)
Hello,
this is a small project Fabik and I made just for fun, which allows you to easily convert images right in your terminal. Written in TypeScript with [Deno](https://deno.land/)

## How to use
- In order for the program to work, you need to have [FFmpeg](https://ffmpeg.org/) installed and added to your PATH
- Usage: `uniconvert.exe <path to image> <output format, e.g. png, jpg, etc.>` -> Saves the input file as the output format with the same name

## Compiling
- Install [Deno](https://deno.land/)
- Run `deno compile -o uniconvert.exe -A main.ts` in the project directory