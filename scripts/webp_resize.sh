#!/usr/bin/env bash
set -euo pipefail

# Resize an animated WebP using webpmux + ImageMagick, preserving:
# - per-frame delay
# - blend method
# - disposal method
#
# Usage:
#   resize-webp-anim.sh input.webp output.webp 512
#   resize-webp-anim.sh input.webp output.webp x300

if [ "$#" -lt 3 ]; then
  echo "Usage: $0 input.webp output.webp <geometry>" >&2
  exit 1
fi

INPUT="$1"
OUTPUT="$2"
GEOM="$3"

TMPDIR="$(mktemp -d /tmp/webp_resize.XXXXXX)"
trap 'rm -rf "$TMPDIR"' EXIT

INFO_FILE="$TMPDIR/webpmux_info.txt"
webpmux -info "$INPUT" > "$INFO_FILE"

# Parse frame count
FRAME_COUNT="$(awk '/Number of frames:/ {print $4}' "$INFO_FILE")"
if [ -z "$FRAME_COUNT" ]; then
  FRAME_COUNT=0
fi

CANVAS_W="$(awk '/Canvas size:/ {print $3; exit}' "$INFO_FILE")"
CANVAS_H="$(awk '/Canvas size:/ {print $5; exit}' "$INFO_FILE")"

if [ "$FRAME_COUNT" -le 1 ]; then
  convert "$INPUT" -resize "$GEOM" "$OUTPUT"
  echo "Wrote $OUTPUT ($FRAME_COUNT frame, resized=$GEOM)."
  exit 0
fi

# Parse frame metadata lines
# Format excerpt:
#   No.: 1
#   offset: (0,0)
#   size: 320x240
#   dispose method: 1
#   blend method: 1
#   frame duration: 100 ms
#
# We extract one line per frame containing: index, duration, blend, dispose, offsetX, offsetY, width, height.

readarray -t META < <(
  webpmux -info "$INPUT" |
  awk '
    function emit() {
      if (idx == "") return
      if (ox == "") ox = 0
      if (oy == "") oy = 0
      if (dur == "") dur = 0
      if (blend == "") blend = 1
      if (dispose == "") dispose = 0
      if (w == "") w = 0
      if (h == "") h = 0
      print idx, dur, blend, dispose, ox, oy, w, h
      idx = ""
      dur = ""
      blend = ""
      dispose = ""
      ox = ""
      oy = ""
      w = ""
      h = ""
    }

    /^[[:space:]]*[0-9]+:/ {
      line = $0
      sub(/^ +/, "", line)
      split(line, fields, /[[:space:]]+/)
      idx = fields[1]
      sub(/:$/, "", idx)
      w = fields[2]
      h = fields[3]
      ox = fields[5]
      oy = fields[6]
      dur = fields[7]
      dispose_word = fields[8]
      blend_word = fields[9]
      if (dispose_word ~ /^background$/i) {
        dispose = 1
      } else if (dispose_word ~ /^previous$/i) {
        dispose = 2
      } else {
        dispose = 0
      }
      blend = (blend_word ~ /^no$/i) ? 0 : 1
      emit()
      next
    }

    /^ No\.:/ {
      idx = $2
      ox = oy = ""
      multiline = 1
      next
    }
    multiline && /size:/ {
      if (match($0, /([0-9]+)x([0-9]+)/, dims)) {
        w = dims[1]
        h = dims[2]
      }
      next
    }
    multiline && /offset:/ {
      if (match($0, /\(([0-9-]+),([0-9-]+)\)/, coords)) {
        ox = coords[1]
        oy = coords[2]
      }
      next
    }
    multiline && /dispose method/ { dispose = $4; next }
    multiline && /blend method/   { blend = $4; next }
    multiline && /frame duration/ {
      dur = $4
      emit()
      multiline = 0
      next
    }
  '
)

needs_canvas_fallback=0
if [ -z "${CANVAS_W:-}" ] || [ -z "${CANVAS_H:-}" ]; then
  needs_canvas_fallback=1
elif ! [[ "$CANVAS_W" =~ ^[0-9]+$ ]] || ! [[ "$CANVAS_H" =~ ^[0-9]+$ ]]; then
  needs_canvas_fallback=1
elif [ "$CANVAS_W" -eq 0 ] || [ "$CANVAS_H" -eq 0 ]; then
  needs_canvas_fallback=1
fi

if [ "$needs_canvas_fallback" -eq 1 ] && [ "${#META[@]}" -gt 0 ]; then
  read -r _ _ _ _ _ _ first_width first_height <<<"${META[0]}"
  CANVAS_W="${CANVAS_W:-$first_width}"
  CANVAS_H="${CANVAS_H:-$first_height}"
fi

TARGET_CANVAS_W=0
TARGET_CANVAS_H=0
if [ -n "${CANVAS_W:-}" ] && [ -n "${CANVAS_H:-}" ] && [ "${CANVAS_W:-0}" -gt 0 ] && [ "${CANVAS_H:-0}" -gt 0 ]; then
  read -r TARGET_CANVAS_W TARGET_CANVAS_H < <(
    convert -size "${CANVAS_W}x${CANVAS_H}" xc:none -resize "$GEOM" -format '%w %h\n' info:
  )
fi

SCALE_PERCENT=""
if [ "${CANVAS_W:-0}" -gt 0 ] && [ "${TARGET_CANVAS_W:-0}" -gt 0 ]; then
  SCALE_PERCENT=$(awk -v tw="$TARGET_CANVAS_W" -v cw="$CANVAS_W" 'BEGIN {
    if (cw == 0) {
      print ""
    } else {
      printf "%.6f", (tw / cw) * 100
    }
  }')
fi

scale_axis() {
  local offset="$1"
  local old_extent="$2"
  local new_extent="$3"
  if [ -z "$old_extent" ] || [ -z "$new_extent" ] || [ "$old_extent" -eq 0 ] || [ "$new_extent" -eq 0 ]; then
    printf '%s' "$offset"
    return
  fi
  awk -v off="$offset" -v ow="$old_extent" -v nw="$new_extent" 'BEGIN {
    printf "%d", int((off * nw / ow) + 0.5)
  }'
}

args=()

for entry in "${META[@]}"; do
  read -r idx dur blend dispose offset_x offset_y orig_width orig_height <<<"$entry"
  offset_x="${offset_x:-0}"
  offset_y="${offset_y:-0}"
  orig_width="${orig_width:-0}"
  orig_height="${orig_height:-0}"

  f="$TMPDIR/frame_$idx.webp"
  rf="$TMPDIR/r_frame_$idx.webp"

  # Extract frame
  webpmux -get frame "$idx" "$INPUT" -o "$f"

  # Resize
  if [ -n "$SCALE_PERCENT" ]; then
    convert "$f" -resize "${SCALE_PERCENT}%" "$rf"
  else
    convert "$f" -resize "$GEOM" "$rf"
  fi

  scaled_offset_x=$(scale_axis "$offset_x" "$CANVAS_W" "$TARGET_CANVAS_W")
  scaled_offset_y=$(scale_axis "$offset_y" "$CANVAS_H" "$TARGET_CANVAS_H")

  # Reassemble args using webpmux syntax:
  #   -frame file +duration[+x+y[+dispose[blend]]]
  frame_spec="+$dur+${scaled_offset_x}+${scaled_offset_y}+${dispose}"
  blend_flag="+b"
  if [ "$blend" = "0" ]; then
    blend_flag="-b"
  fi
  frame_spec+="$blend_flag"
  args+=( -frame "$rf" "$frame_spec" )
done

webpmux "${args[@]}" -loop 0 -o "$OUTPUT"

echo "Wrote $OUTPUT ($FRAME_COUNT frames, resized=$GEOM, delays preserved)."
