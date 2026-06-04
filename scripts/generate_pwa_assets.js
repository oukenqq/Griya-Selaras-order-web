import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Solid background Coklat Espresso -->
  <rect width="512" height="512" fill="#3A2E2A" />
  
  <!-- Elegant typography for GS in Cream -->
  <text x="256" y="225" font-family="'Plus Jakarta Sans', 'Poppins', 'Inter', system-ui, -apple-system, sans-serif" font-weight="800" font-size="185" fill="#EADDC8" text-anchor="middle" dominant-baseline="central" letter-spacing="-4">GS</text>
  
  <!-- Beautiful centered small scissors icon in Cream -->
  <g transform="translate(226, 335) scale(2.5)" stroke="#EADDC8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="9.8" y1="8.2" x2="21" y2="15" />
    <line x1="9.8" y1="15.8" x2="21" y2="9" />
  </g>
</svg>
`;

async function main() {
  const publicDir = path.resolve('./public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('Created /public directory.');
  }

  const svgBuffer = Buffer.from(svgIcon);

  // Define PWA Asset Outputs
  const targets = [
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon.ico', size: 32 } // Savely outputs PNG bytes as favicon.ico, standard in modern web
  ];

  for (const target of targets) {
    const outputPath = path.join(publicDir, target.name);
    await sharp(svgBuffer)
      .resize(target.size, target.size)
      .toFile(outputPath);
    console.log(`Generated: ${target.name} (${target.size}x${target.size}) at ${outputPath}`);
  }

  console.log('PWA icon generation complete successfully!');
}

main().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
