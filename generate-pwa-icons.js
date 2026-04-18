#!/usr/bin/env node

/**
 * PWA Icon Generator Script
 * 
 * This script generates PWA icons from your favicon.svg
 * 
 * Usage:
 *   node generate-pwa-icons.js
 * 
 * Requirements:
 *   npm install sharp
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Icon sizes to generate
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Paths
const PUBLIC_DIR = join(__dirname, 'public');
const ICONS_DIR = join(PUBLIC_DIR, 'icons');
const FAVICON_PATH = join(PUBLIC_DIR, 'favicon.svg');

async function generateIcons() {
  console.log('🎨 PWA Icon Generator\n');

  // Check if sharp is installed
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch (error) {
    console.log('❌ Sharp library not installed.');
    console.log('\nTo install, run:');
    console.log('  npm install sharp\n');
    console.log('Alternatively, use the browser-based generator:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Open: http://localhost:5173/generate-icons.html\n');
    process.exit(1);
  }

  // Check if favicon exists
  try {
    await fs.access(FAVICON_PATH);
  } catch (error) {
    console.error('❌ favicon.svg not found at:', FAVICON_PATH);
    process.exit(1);
  }

  // Create icons directory
  try {
    await fs.mkdir(ICONS_DIR, { recursive: true });
    console.log('📁 Created icons directory');
  } catch (error) {
    // Directory already exists
  }

  console.log('📐 Generating icons...\n');

  // Generate each size
  for (const size of ICON_SIZES) {
    const outputPath = join(ICONS_DIR, `icon-${size}x${size}.png`);
    
    try {
      await sharp(FAVICON_PATH)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Failed to generate icon-${size}x${size}.png:`, error.message);
    }
  }

  console.log('\n✨ All icons generated successfully!');
  console.log(`📂 Icons saved to: ${ICONS_DIR}`);
  console.log('\nNext steps:');
  console.log('  1. Verify icons in public/icons/');
  console.log('  2. Run: npm run dev');
  console.log('  3. Test PWA features in browser\n');
}

// Run the script
generateIcons().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
