#!/bin/bash

# Script to generate PWA icons from SVG
# Requires ImageMagick or similar tool

SIZES=(72 96 128 144 152 192 384 512)
INPUT="static/icons/icon.svg"
OUTPUT_DIR="static/icons"

echo "Generating PWA icons..."

for size in "${SIZES[@]}"; do
  output="${OUTPUT_DIR}/icon-${size}x${size}.png"
  
  # Try different commands based on what's available
  if command -v magick &> /dev/null; then
    magick "$INPUT" -resize ${size}x${size} "$output"
  elif command -v convert &> /dev/null; then
    convert "$INPUT" -resize ${size}x${size} "$output"
  elif command -v inkscape &> /dev/null; then
    inkscape "$INPUT" -w $size -h $size -o "$output"
  else
    echo "No image conversion tool found. Please install ImageMagick or Inkscape."
    echo "For now, using placeholder approach..."
    exit 1
  fi
  
  echo "Generated: $output"
done

echo "Icon generation complete!"
