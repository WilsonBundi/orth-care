/**
 * Image Verification Script
 * Checks if all required images are present in the public/images directory
 */

const fs = require('fs');
const path = require('path');

// Required images for the homepage
const requiredImages = [
    {
        filename: 'doctor-consultation.jpg',
        description: 'Doctor consultation image',
        maxSize: 100 * 1024, // 100KB
        dimensions: '800x600px'
    },
    {
        filename: 'medical-facility.jpg',
        description: 'Medical facility image',
        maxSize: 100 * 1024,
        dimensions: '800x600px'
    },
    {
        filename: 'digital-health.jpg',
        description: 'Digital health image',
        maxSize: 100 * 1024,
        dimensions: '800x600px'
    },
    {
        filename: 'joint-pain.jpg',
        description: 'Joint pain treatment image',
        maxSize: 100 * 1024,
        dimensions: '800x600px'
    },
    {
        filename: 'knee-pain.jpg',
        description: 'Sports medicine image',
        maxSize: 100 * 1024,
        dimensions: '800x600px'
    },
    {
        filename: 'shoulder-pain.jpg',
        description: 'Pain management image',
        maxSize: 100 * 1024,
        dimensions: '800x600px'
    }
];

const imagesDir = path.join(__dirname, 'public', 'images');

console.log('🔍 Checking for required images...\n');
console.log('=' .repeat(70));

let allPresent = true;
let allOptimized = true;
const results = [];

// Check if images directory exists
if (!fs.existsSync(imagesDir)) {
    console.log('❌ Images directory does not exist: public/images/');
    console.log('   Create it with: mkdir public/images\n');
    process.exit(1);
}

// Check each required image
requiredImages.forEach((image, index) => {
    const imagePath = path.join(imagesDir, image.filename);
    const exists = fs.existsSync(imagePath);
    
    let status = '❌ MISSING';
    let sizeInfo = '';
    let optimized = false;
    
    if (exists) {
        const stats = fs.statSync(imagePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        const maxSizeKB = (image.maxSize / 1024).toFixed(0);
        
        if (stats.size <= image.maxSize) {
            status = '✅ PRESENT & OPTIMIZED';
            optimized = true;
        } else {
            status = '⚠️  PRESENT BUT TOO LARGE';
            allOptimized = false;
        }
        
        sizeInfo = ` (${sizeKB}KB / ${maxSizeKB}KB max)`;
    } else {
        allPresent = false;
    }
    
    results.push({
        filename: image.filename,
        description: image.description,
        status,
        sizeInfo,
        exists,
        optimized
    });
    
    console.log(`${index + 1}. ${image.filename}`);
    console.log(`   ${image.description}`);
    console.log(`   Status: ${status}${sizeInfo}`);
    console.log(`   Required: ${image.dimensions}, <${(image.maxSize / 1024).toFixed(0)}KB`);
    console.log('');
});

console.log('=' .repeat(70));
console.log('\n📊 SUMMARY\n');

const presentCount = results.filter(r => r.exists).length;
const optimizedCount = results.filter(r => r.optimized).length;

console.log(`Images present: ${presentCount}/${requiredImages.length}`);
console.log(`Images optimized: ${optimizedCount}/${requiredImages.length}`);

if (allPresent && allOptimized) {
    console.log('\n✅ SUCCESS! All images are present and optimized.');
    console.log('   You can now push to GitHub for deployment.\n');
    console.log('   Commands:');
    console.log('   git add public/images/');
    console.log('   git commit -m "Add professional healthcare images"');
    console.log('   git push origin main\n');
} else if (allPresent && !allOptimized) {
    console.log('\n⚠️  WARNING! All images are present but some need optimization.');
    console.log('   Please compress large images using TinyPNG: https://tinypng.com/\n');
    
    results.filter(r => r.exists && !r.optimized).forEach(r => {
        console.log(`   - ${r.filename} needs compression`);
    });
    console.log('');
} else {
    console.log('\n❌ INCOMPLETE! Some images are missing.');
    console.log('   Please add the following images:\n');
    
    results.filter(r => !r.exists).forEach(r => {
        console.log(`   - ${r.filename} (${r.description})`);
    });
    
    console.log('\n   📖 For help, see:');
    console.log('   - ADD_YOUR_IMAGES_HERE.md');
    console.log('   - IMAGE_GUIDELINES.md');
    console.log('   - Open public/images/download-images-guide.html in browser\n');
}

console.log('=' .repeat(70));

// Exit with appropriate code
if (allPresent && allOptimized) {
    process.exit(0);
} else {
    process.exit(1);
}
