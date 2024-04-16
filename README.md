# UniConvert by [Fabik](https://github.com/LegendFabix) and [DNA](https://github.com/DNAScanner)

G'day,
this is a small project Fabik and I made just for fun, which allows you to easily convert images, audio files and videos right in your terminal. Written in TypeScript with [Deno](https://deno.land/)

## How to use

| Command                          | Alias | Description                                                   |
| -------------------------------- | ----- | ------------------------------------------------------------- |
| `uniconvert --help`              | `-h`  | Shows the help message                                        |
| `uniconvert --filetypes`         | `-ft` | Shows a list of supported filetypes                           |
| `uniconvert --upgrade`           | `-u`  | Upgrades UniConvert to the latest version (still in progress) |
| `uniconvert test.mp4 hls`        |       | Converts `test.mp4` to `test.m3u8`                            |
| `uniconvert ./folder/:image png` |       | Converts all images in `folder` to `png`                      |
| `uniconvert ./folder/:mov mp4`   |       | Converts all `.mov` files in `folder` to `mp4`                |
| `uniconvert ./test.mp3 ogg -k`   |       | Converts `test.mp3` to `test.ogg` and keeps the original file |

Arguments:
- `--keep-original` or `-k`: Keeps the original file after conversion (@default: `false`)

## How to install

- Install [FFmpeg](https://github.com/BtbN/FFmpeg-Builds/releases) to PATH.
- Install [Uniconvert](https://github.com/DNAScanner/UniConvert) (to PATH).

## Compiling

To compile, you need to install [wincompile](https://github.com/Leokuma/wincompile):

```bash
deno run -A build.ts
```
