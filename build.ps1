deno compile -o uniconvert -A main.ts
Get-FileHash .\uniconvert.exe | Select-Object -ExpandProperty Hash > hash.txt