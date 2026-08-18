const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/icon.svg');
const publicDir = path.join(__dirname, '../public');

async function generateIcons() {
  try {
    // Generate 192x192 icon
    await sharp(svgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    
    console.log('✓ Generated icon-192.png');

    // Generate 512x512 icon
    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    
    console.log('✓ Generated icon-512.png');

    // Generate favicon (32x32)
    await sharp(svgPath)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon-32.png'));
    
    console.log('✓ Generated favicon-32.png');

    // Generate apple-touch-icon (180x180)
    await sharp(svgPath)
      .resize(180, 180)
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    
    console.log('✓ Generated apple-touch-icon.png');

    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
