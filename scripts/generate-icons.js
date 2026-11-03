import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toHash = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toHash), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePNG(size, isMaskable = false) {
  const width = size;
  const height = size;
  const rowStride = width * 4 + 1; // 1 filter byte per row
  const raw = Buffer.alloc(height * rowStride);

  // Background color #142B4A -> RGB(20, 43, 74)
  // Accent color #2563EB -> RGB(37, 99, 235)
  // White #FFFFFF -> RGB(255, 255, 255)
  const center = size / 2;
  const radius = size * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    raw[rowOffset] = 0; // Filter type None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background navy: 20, 43, 74
      let r = 20, g = 43, b = 74, a = 255;

      if (!isMaskable) {
        // Squircle / rounded rect for non-maskable
        const cornerR = size * 0.22;
        const qx = Math.max(0, Math.abs(dx) - (center - cornerR));
        const qy = Math.max(0, Math.abs(dy) - (center - cornerR));
        const cornerDist = Math.sqrt(qx * qx + qy * qy);
        if (cornerDist > cornerR) {
          a = 0; // Transparent outside rounded corner
        }
      }

      if (a > 0) {
        // Draw icon elements: Graduation cap / Book shape in center
        // Center badge circle
        const innerRadius = size * 0.28;
        if (dist <= innerRadius) {
          // Inner blue circle #2563EB
          r = 37; g = 99; b = 235;
        }

        // Draw Stylized "S" / Book icon inside
        const nx = dx / size; // -0.5 to 0.5
        const ny = dy / size;

        // Open book pages or study badge
        const inLeftPage = (nx >= -0.16 && nx <= -0.02 && ny >= -0.12 && ny <= 0.12);
        const inRightPage = (nx >= 0.02 && nx <= 0.16 && ny >= -0.12 && ny <= 0.12);
        const inSpine = (Math.abs(nx) <= 0.02 && ny >= -0.12 && ny <= 0.14);

        if ((inLeftPage || inRightPage) && !inSpine) {
          r = 255; g = 255; b = 255;
        }

        // Checkmark or bookmark ribbon in green #16A34A (RGB 22, 163, 74)
        if (nx >= 0.05 && nx <= 0.09 && ny >= -0.14 && ny <= 0.04) {
          r = 22; g = 163; b = 74;
        }
      }

      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const idatData = zlib.deflateSync(raw, { level: 9 });

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PWA icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePNG(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePNG(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePNG(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePNG(180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePNG(64, false));

console.log('Icons generated successfully in /public');
