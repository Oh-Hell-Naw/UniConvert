:: VLC installation folder: C:\Program Files\VideoLAN\VLC
:: There will be two files required: One as the input (the first argument, type mp4) and one as the output (the second argument, type mp3). Use vlc to convert the input file to the output file. When there is no output file, the input file will be converted to a file with the same name but with the output file type.

@echo off
setlocal enabledelayedexpansion
set "input=%~1"
set "output=%~2"
if "%input%"=="" echo Usage: %~nx0 ^<input file^> ^[^<output file^>^] & goto :eof
if "%output%"=="" set "output=%~n1.mp3"
if exist "%output%" del "%output%"
if not exist "%input%" echo Input file "%input%" not found & goto :eof
echo Converting [33m%input%[0m to [33m%output%[0m...
"C:\Program Files\VideoLAN\VLC\vlc.exe" -I dummy -q "%input%" --sout=#transcode{acodec=mp3,ab=128,vcodec=dummy}:standard{access=file,mux=raw,dst="%output%"} vlc://quit
echo Done. Output file: [33m%output%[0m
endlocal