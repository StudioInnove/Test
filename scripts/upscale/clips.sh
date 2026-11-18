#!/bin/bash
# Upscale every transition clip, frame by frame (12 fps), resumable.
cd /tmp/claude-0/-home-claude/33ba446c-befa-5be7-af6f-13defbf25a61/scratchpad
for c in $@; do
  mkdir -p sr/seq_$c filmsrc_up/frames/$c
  fps=12; [ "$c" = "cl" ] && fps=15
  [ -f sr/seq_$c/001.png ] || ffmpeg -loglevel error -y -i filmsrc/$c.mp4 -vf fps=$fps sr/seq_$c/%03d.png
  python3 -I sr/upscale.py sr/srvgg_x4.onnx 2400 sr/seq_$c/*.png --out filmsrc_up/frames/$c
done
echo ALL DONE
