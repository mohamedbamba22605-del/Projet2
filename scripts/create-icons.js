import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple PNG creation using base64 encoded minimal PNG with the icon
// This creates a red square with a white drop shape

function createSimplePNG(size, outputPath) {
    // Create a simple PNG with the icon design
    // For simplicity, we'll create a basic red square with white drop
    
    const width = size;
    const height = size;
    
    // PNG header (8 bytes)
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    
    // IHDR chunk
    const ihdr = createIHDR(width, height);
    
    // IDAT chunk with simple image data
    const idat = createIDAT(width, height);
    
    // IEND chunk
    const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
    
    const png = Buffer.concat([pngSignature, ihdr, idat, iend]);
    
    fs.writeFileSync(outputPath, png);
    console.log(`✓ Created ${outputPath}`);
}

function createIHDR(width, height) {
    const data = Buffer.alloc(13);
    data.writeUInt32BE(width, 0);
    data.writeUInt32BE(height, 4);
    data[8] = 8; // bit depth
    data[9] = 2; // color type (RGB)
    data[10] = 0; // compression
    data[11] = 0; // filter
    data[12] = 0; // interlace
    
    return createChunk('IHDR', data);
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    
    const typeBuffer = Buffer.from(type);
    const crc = calculateCRC(Buffer.concat([typeBuffer, data]));
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc, 0);
    
    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function createIDAT(width, height) {
    // Create simple image data - red background with white drop
    const rowSize = width * 3 + 1; // 3 bytes per pixel (RGB) + 1 filter byte
    const rawData = Buffer.alloc(height * rowSize);
    
    for (let y = 0; y < height; y++) {
        const rowOffset = y * rowSize;
        rawData[rowOffset] = 0; // filter type
        
        for (let x = 0; x < width; x++) {
            const pixelOffset = rowOffset + 1 + x * 3;
            
            // Red background (#dc2626 = 220, 38, 38)
            const centerX = width / 2;
            const centerY = height / 2;
            const scale = width / 100;
            
            // Simple drop shape calculation
            const dx = (x - centerX) / scale;
            const dy = (y - centerY) / scale;
            
            // Check if point is inside drop shape
            const inDrop = isInDropShape(dx, dy);
            
            if (inDrop) {
                // White
                rawData[pixelOffset] = 255;     // R
                rawData[pixelOffset + 1] = 255; // G
                rawData[pixelOffset + 2] = 255; // B
            } else {
                // Red
                rawData[pixelOffset] = 220;     // R
                rawData[pixelOffset + 1] = 38;  // G
                rawData[pixelOffset + 2] = 38;  // B
            }
        }
    }
    
    // Compress with deflate
    const compressed = zlib.deflateSync(rawData);
    
    return createChunk('IDAT', compressed);
}

function isInDropShape(x, y) {
    // Simplified drop shape
    // Top point at (0, -30), bottom at (0, 34), width at 22
    const topY = -30;
    const bottomY = 34;
    const width = 22;
    
    if (y < topY || y > bottomY) return false;
    
    // Calculate width at this y
    const progress = (y - topY) / (bottomY - topY);
    const currentWidth = width * (0.3 + 0.7 * Math.sin(progress * Math.PI));
    
    return Math.abs(x) <= currentWidth;
}

function calculateCRC(data) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

const publicDir = path.join(__dirname, '../public');

console.log('Creating PWA icons...');

createSimplePNG(192, path.join(publicDir, 'icon-192.png'));
createSimplePNG(512, path.join(publicDir, 'icon-512.png'));
createSimplePNG(180, path.join(publicDir, 'apple-touch-icon.png'));
createSimplePNG(32, path.join(publicDir, 'favicon-32.png'));

console.log('✅ All icons created successfully!');
