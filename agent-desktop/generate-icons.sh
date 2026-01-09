#!/bin/bash
# Script pour générer les icônes de l'application
# Nécessite ImageMagick: brew install imagemagick (macOS) ou sudo apt install imagemagick (Linux)

ICON_DIR="src-tauri/icons"
mkdir -p "$ICON_DIR"

# Créer une icône SVG de base
cat > "$ICON_DIR/icon.svg" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e94560"/>
      <stop offset="100%" style="stop-color:#ff6b6b"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="140" fill="none" stroke="white" stroke-width="30"/>
  <polygon points="220,180 220,332 340,256" fill="white"/>
</svg>
EOF

echo "Icône SVG créée: $ICON_DIR/icon.svg"

# Convertir en PNG si ImageMagick est disponible
if command -v convert &> /dev/null; then
    convert "$ICON_DIR/icon.svg" -resize 32x32 "$ICON_DIR/32x32.png"
    convert "$ICON_DIR/icon.svg" -resize 128x128 "$ICON_DIR/128x128.png"
    convert "$ICON_DIR/icon.svg" -resize 256x256 "$ICON_DIR/128x128@2x.png"
    convert "$ICON_DIR/icon.svg" -resize 512x512 "$ICON_DIR/icon.png"
    
    # Pour macOS
    if command -v iconutil &> /dev/null; then
        mkdir -p "$ICON_DIR/icon.iconset"
        convert "$ICON_DIR/icon.svg" -resize 16x16 "$ICON_DIR/icon.iconset/icon_16x16.png"
        convert "$ICON_DIR/icon.svg" -resize 32x32 "$ICON_DIR/icon.iconset/icon_16x16@2x.png"
        convert "$ICON_DIR/icon.svg" -resize 32x32 "$ICON_DIR/icon.iconset/icon_32x32.png"
        convert "$ICON_DIR/icon.svg" -resize 64x64 "$ICON_DIR/icon.iconset/icon_32x32@2x.png"
        convert "$ICON_DIR/icon.svg" -resize 128x128 "$ICON_DIR/icon.iconset/icon_128x128.png"
        convert "$ICON_DIR/icon.svg" -resize 256x256 "$ICON_DIR/icon.iconset/icon_128x128@2x.png"
        convert "$ICON_DIR/icon.svg" -resize 256x256 "$ICON_DIR/icon.iconset/icon_256x256.png"
        convert "$ICON_DIR/icon.svg" -resize 512x512 "$ICON_DIR/icon.iconset/icon_256x256@2x.png"
        convert "$ICON_DIR/icon.svg" -resize 512x512 "$ICON_DIR/icon.iconset/icon_512x512.png"
        convert "$ICON_DIR/icon.svg" -resize 1024x1024 "$ICON_DIR/icon.iconset/icon_512x512@2x.png"
        iconutil -c icns "$ICON_DIR/icon.iconset" -o "$ICON_DIR/icon.icns"
        rm -rf "$ICON_DIR/icon.iconset"
        echo "Icône macOS créée: $ICON_DIR/icon.icns"
    fi
    
    # Pour Windows (ICO)
    if command -v convert &> /dev/null; then
        convert "$ICON_DIR/icon.svg" -resize 256x256 -define icon:auto-resize=256,128,64,48,32,16 "$ICON_DIR/icon.ico"
        echo "Icône Windows créée: $ICON_DIR/icon.ico"
    fi
    
    echo "Toutes les icônes PNG ont été générées!"
else
    echo "ImageMagick non trouvé. Installez-le pour générer les icônes PNG:"
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu/Debian: sudo apt install imagemagick"
    echo ""
    echo "En attendant, vous pouvez utiliser un convertisseur en ligne pour convertir icon.svg"
fi
