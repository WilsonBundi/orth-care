# Image Guidelines for Orthopedic's Care Portal

## Inspiration from SHA (Social Health Authority)

Based on the professional imagery from https://sha.go.ke/, here are guidelines for images in the Orthopedic's Care portal.

## Image Style Guidelines

### 1. Professional Healthcare Photography
- ✅ Real people (patients, doctors, families)
- ✅ Authentic healthcare settings
- ✅ Diverse representation (age, gender, ethnicity)
- ✅ Warm, welcoming expressions
- ✅ Natural lighting and colors
- ❌ Stock photos that look too staged
- ❌ Overly clinical/sterile imagery

### 2. Color Palette
- **Primary:** Blue tones (trust, healthcare)
- **Secondary:** Warm tones (care, compassion)
- **Backgrounds:** Light, airy, professional
- **Avoid:** Dark, gloomy, or overly bright images

### 3. Image Types Needed

#### Hero Images (Homepage)
- **Size:** 1920x1080px (Full HD)
- **Subject:** 
  - Happy patient with doctor
  - Family receiving care
  - Orthopedic consultation
  - Physical therapy session
- **Style:** Wide shot, professional, welcoming

#### Section Images
- **Size:** 800x600px
- **Subjects:**
  - Doctor examining patient
  - X-ray/diagnostic equipment
  - Rehabilitation exercises
  - Patient recovery success stories

#### Icons/Illustrations
- **Size:** 256x256px or SVG
- **Style:** Simple, modern, consistent
- **Subjects:**
  - Medical symbols
  - Appointment calendar
  - Medical records
  - Billing/payment

## Recommended Image Sources

### Free Stock Photos (Professional Healthcare)
1. **Unsplash** - https://unsplash.com/s/photos/healthcare
   - Search: "doctor", "hospital", "medical", "orthopedic"
   - High quality, free to use

2. **Pexels** - https://www.pexels.com/search/medical/
   - Search: "healthcare", "doctor patient", "medical consultation"
   - Free for commercial use

3. **Pixabay** - https://pixabay.com/images/search/healthcare/
   - Search: "medical", "doctor", "hospital"
   - Free, no attribution required

### Kenyan Context (Preferred)
- Look for images featuring:
  - Kenyan healthcare professionals
  - Local hospital settings
  - Diverse Kenyan families
  - African healthcare context

## Image Placement Guide

### 1. Homepage (`public/index.html`)

**Hero Section:**
```html
<!-- Replace placeholder with professional image -->
<div class="hero" style="background-image: url('/images/hero-orthopedic-care.jpg');">
    <div class="hero-content">
        <h1>Expert Orthopedic Care</h1>
        <p>Specialized treatment for bone, joint, and muscle conditions</p>
    </div>
</div>
```

**Recommended Images:**
- `hero-orthopedic-care.jpg` - Doctor with patient, warm setting
- `hero-family-care.jpg` - Family receiving healthcare
- `hero-consultation.jpg` - Professional consultation scene

### 2. Services Section

**Images Needed:**
```
/images/services/
├── orthopedic-consultation.jpg
├── sports-medicine.jpg
├── joint-replacement.jpg
├── physical-therapy.jpg
├── spine-care.jpg
└── trauma-care.jpg
```

**Size:** 600x400px  
**Style:** Professional, showing the service in action

### 3. About/Team Section

**Images Needed:**
```
/images/team/
├── doctor-placeholder.jpg
├── nurse-placeholder.jpg
└── staff-team.jpg
```

**Size:** 400x400px (square for profiles)  
**Style:** Professional headshots, friendly expressions

### 4. Dashboard/Portal

**Images Needed:**
```
/images/portal/
├── appointment-icon.svg
├── medical-records-icon.svg
├── billing-icon.svg
├── profile-icon.svg
└── empty-state-illustration.svg
```

**Style:** Simple, modern icons/illustrations

## Image Optimization

### Before Adding Images:
1. **Resize** to appropriate dimensions
2. **Compress** to reduce file size (use TinyPNG or similar)
3. **Format:**
   - Photos: JPG (quality 80-85%)
   - Graphics/Icons: PNG or SVG
   - Logos: SVG preferred

### Target File Sizes:
- Hero images: < 200KB
- Section images: < 100KB
- Icons: < 20KB
- Thumbnails: < 50KB

## Implementation Examples

### 1. Hero Section with Image
```html
<section class="hero">
    <img src="/images/hero-orthopedic-care.jpg" 
         alt="Professional orthopedic care consultation"
         class="hero-image">
    <div class="hero-overlay">
        <div class="hero-content">
            <h1>Expert Orthopedic Care</h1>
            <p>Comprehensive treatment for all bone and joint conditions</p>
            <a href="/register.html" class="btn btn-primary">Get Started</a>
        </div>
    </div>
</section>
```

### 2. Service Cards with Images
```html
<div class="service-card">
    <img src="/images/services/orthopedic-consultation.jpg" 
         alt="Orthopedic consultation"
         class="service-image">
    <h3>Orthopedic Consultation</h3>
    <p>Expert diagnosis and treatment planning</p>
</div>
```

### 3. Responsive Images
```html
<picture>
    <source media="(min-width: 768px)" 
            srcset="/images/hero-large.jpg">
    <source media="(min-width: 480px)" 
            srcset="/images/hero-medium.jpg">
    <img src="/images/hero-small.jpg" 
         alt="Orthopedic care"
         class="responsive-image">
</picture>
```

## CSS for Professional Image Display

```css
/* Hero Image */
.hero {
    position: relative;
    height: 600px;
    overflow: hidden;
}

.hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
}

.hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
        135deg,
        rgba(30, 60, 114, 0.8),
        rgba(102, 126, 234, 0.6)
    );
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Service Images */
.service-image {
    width: 100%;
    height: 250px;
    object-fit: cover;
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-4);
}

/* Team Photos */
.team-photo {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid var(--color-primary-100);
}

/* Responsive Images */
.responsive-image {
    width: 100%;
    height: auto;
    display: block;
}
```

## Specific Image Recommendations

### Homepage Hero
**Search Terms:** 
- "African doctor patient consultation"
- "Kenyan healthcare professional"
- "Orthopedic doctor examining patient"
- "Physical therapy session Africa"

**Example URLs (Unsplash):**
- https://unsplash.com/s/photos/african-doctor
- https://unsplash.com/s/photos/healthcare-africa
- https://unsplash.com/s/photos/orthopedic

### Services Section
**Search Terms:**
- "Orthopedic consultation"
- "Physical therapy"
- "X-ray examination"
- "Joint replacement surgery"
- "Sports medicine"

### About Section
**Search Terms:**
- "Medical team Africa"
- "Healthcare professionals Kenya"
- "Hospital staff portrait"
- "Diverse medical team"

## Image Accessibility

### Always Include:
1. **Alt Text:** Descriptive, meaningful
   ```html
   <img src="doctor.jpg" 
        alt="Dr. Sarah examining patient's knee during orthopedic consultation">
   ```

2. **Loading Optimization:**
   ```html
   <img src="image.jpg" 
        alt="Description"
        loading="lazy">
   ```

3. **Responsive Sizing:**
   ```html
   <img src="image.jpg"
        alt="Description"
        srcset="image-small.jpg 480w,
                image-medium.jpg 768w,
                image-large.jpg 1200w"
        sizes="(max-width: 768px) 100vw, 50vw">
   ```

## Quick Start: Adding Images

### Step 1: Download Images
1. Visit Unsplash/Pexels
2. Search for healthcare/medical images
3. Download high-quality versions
4. Rename descriptively (e.g., `hero-orthopedic-consultation.jpg`)

### Step 2: Optimize Images
1. Use TinyPNG.com or similar
2. Resize to recommended dimensions
3. Compress to target file size

### Step 3: Add to Project
```bash
# Create images directory structure
mkdir -p public/images/hero
mkdir -p public/images/services
mkdir -p public/images/team
mkdir -p public/images/icons
```

### Step 4: Update HTML
Replace placeholder images with real ones:
```html
<!-- Before -->
<div class="hero">🏥</div>

<!-- After -->
<div class="hero">
    <img src="/images/hero/orthopedic-care.jpg" 
         alt="Professional orthopedic care">
</div>
```

## Image Checklist

Before deploying:
- [ ] All images optimized (< target file size)
- [ ] Alt text added to all images
- [ ] Responsive images for mobile
- [ ] Images match brand colors
- [ ] Professional, high-quality photos
- [ ] Diverse representation
- [ ] Appropriate for healthcare context
- [ ] Copyright-free or properly licensed

## Summary

**Key Takeaways:**
1. Use professional, authentic healthcare imagery
2. Feature diverse, Kenyan context when possible
3. Optimize all images for web performance
4. Include proper alt text for accessibility
5. Match the warm, professional style of SHA website
6. Use free stock photo sites (Unsplash, Pexels)
7. Compress images before uploading

**Next Steps:**
1. Download 5-10 key images from Unsplash/Pexels
2. Optimize and resize them
3. Add to `/public/images/` directory
4. Update HTML files with image references
5. Test on mobile and desktop
6. Push to GitHub for deployment
