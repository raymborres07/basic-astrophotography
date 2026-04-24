const canvas = document.getElementById('astroCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// Setup Canvas size
function resizeCanvas() {
    canvas.width = 800;
    canvas.height = 500;
}
resizeCanvas();

// Star Data Generation
const stars = [];
const numStars = 400;

function generateStars() {
    stars.length = 0;
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.8 + 0.2,
            brightness: Math.random() * 0.8 + 0.2,
            color: getRandomStarColor()
        });
    }
}

function getRandomStarColor() {
    const colors = ['#FFFFFF', '#FFF4E8', '#E8F4FF', '#FFD2A1', '#A1D2FF'];
    return colors[Math.floor(Math.random() * colors.length)];
}

generateStars();

const clouds = [];
function generateClouds() {
    clouds.length = 0;
    for (let i = 0; i < 15; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.8),
            rx: 60 + Math.random() * 140,
            ry: 30 + Math.random() * 60,
            alpha: 0.6 + Math.random() * 0.3,
            rotation: Math.random() * Math.PI
        });
    }
}
generateClouds();

function draw() {
    const fl = parseFloat(document.getElementById('fl').value);
    const ap = parseFloat(document.getElementById('ap').value);
    const ss = parseFloat(document.getElementById('ss').value);
    const iso = parseFloat(document.getElementById('iso').value);
    const weather = document.getElementById('weather').value;

    // Update UI Labels
    document.getElementById('fl-val').innerText = fl + "mm";
    document.getElementById('ap-val').innerText = "f/" + ap;
    document.getElementById('ss-val').innerText = ss + "s";
    document.getElementById('iso-val').innerText = iso;
    document.getElementById('weather-val').innerText = weather.charAt(0).toUpperCase() + weather.slice(1);

    // 500 Rule calculation
    const limit = Math.round(500 / fl);
    document.getElementById('limit-val').innerText = limit + "s";

    // Exposure calculation
    const exposureValue = (ss * iso) / (Math.pow(ap, 2) * 100);
    const normalizedExposure = Math.min(2.5, exposureValue / 20); 

    // Clear Canvas with Sky Color
    let bgBrightness = Math.min(40, normalizedExposure * 15);
    
    // Weather effects on sky color
    if (weather === 'hazy') bgBrightness += 30; // Light pollution / haze
    if (weather === 'cloudy') bgBrightness += 10;

    ctx.fillStyle = `rgb(${bgBrightness}, ${bgBrightness * 1.1}, ${bgBrightness * 1.4})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Star Trailing
    const trailAmount = ss > limit ? (ss - limit) * 1.5 : 0;
    const angle = 0.2;

    stars.forEach(star => {
        let starVisibility = Math.min(1, star.brightness * (normalizedExposure + 0.1));
        
        // Weather effects on stars
        if (weather === 'hazy') starVisibility *= 0.6;
        if (weather === 'cloudy') starVisibility *= 0.3;

        ctx.globalAlpha = starVisibility;
        ctx.fillStyle = star.color;
        
        if (trailAmount > 0) {
            ctx.beginPath();
            ctx.lineWidth = star.size;
            ctx.lineCap = 'round';
            ctx.strokeStyle = star.color;
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(star.x + trailAmount, star.y - (trailAmount * angle));
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw Clouds for 'cloudy' weather
    if (weather === 'cloudy') {
        clouds.forEach(cloud => {
            ctx.globalAlpha = cloud.alpha;
            ctx.fillStyle = 'rgba(50, 50, 60, 0.8)';
            ctx.beginPath();
            ctx.ellipse(cloud.x, cloud.y, cloud.rx, cloud.ry, cloud.rotation, 0, Math.PI * 2);
            ctx.fill();
            
            // Add a subtle highlight to cloud edges
            ctx.strokeStyle = 'rgba(100, 100, 120, 0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    ctx.globalAlpha = 1.0;

    if (iso >= 1600) applyNoise(iso);
    updateStatus(normalizedExposure, trailAmount, iso, weather);
}

function applyNoise(iso) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const noiseDensity = (iso - 800) / 12800;
    const noiseIntensity = (iso / 12800) * 40;

    for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < noiseDensity * 0.1) {
            const n = (Math.random() - 0.5) * noiseIntensity;
            data[i] = Math.max(0, Math.min(255, data[i] + n));
            data[i+1] = Math.max(0, Math.min(255, data[i+1] + n));
            data[i+2] = Math.max(0, Math.min(255, data[i+2] + n));
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

function updateStatus(exposure, trail, iso, weather) {
    const statusEl = document.getElementById('status-msg');
    let message = "Excellent Exposure";
    let color = "var(--success)";

    if (weather === 'cloudy') {
        message = "Partly Cloudy: Variable Visibility";
        color = "var(--warning)";
    } else if (exposure < 0.5) {
        message = "Underexposed (Increase ISO or Shutter)";
        color = "var(--error)";
    } else if (exposure > 10) {
        message = "Overexposed (Washed Out)";
        color = "var(--error)";
    } else if (trail > 0) {
        message = "Star Trails Detected (Earth Rotation)";
        color = "var(--warning)";
    } else if (iso >= 6400) {
        message = "High Sensor Noise Detected";
        color = "var(--warning)";
    } else if (weather === 'hazy') {
        message = "Heavy Haze: Contrast is Poor";
        color = "var(--warning)";
    }

    statusEl.innerText = message;
    statusEl.style.color = color;
}

// POST-PROCESSING TOOL LOGIC
const practiceImg = document.getElementById('practiceImg');
const editInputs = ['edit-exp', 'edit-con', 'edit-temp', 'edit-vib'];

function updateImageFilters() {
    const exp = document.getElementById('edit-exp').value;
    const con = document.getElementById('edit-con').value;
    const temp = document.getElementById('edit-temp').value;
    const vib = document.getElementById('edit-vib').value;
    const sat = document.getElementById('edit-sat').value;
    const tint = document.getElementById('edit-tint').value;
    const high = document.getElementById('edit-high').value;
    const shad = document.getElementById('edit-shad').value;

    document.getElementById('edit-exp-val').innerText = exp + "%";
    document.getElementById('edit-con-val').innerText = con + "%";
    document.getElementById('edit-temp-val').innerText = temp > 0 ? "+" + temp : temp;
    document.getElementById('edit-vib-val').innerText = vib + "%";
    document.getElementById('edit-sat-val').innerText = sat + "%";
    document.getElementById('edit-tint-val').innerText = tint > 0 ? "+" + tint : tint;
    document.getElementById('edit-high-val').innerText = high > 0 ? "+" + high : high;
    document.getElementById('edit-shad-val').innerText = shad > 0 ? "+" + shad : shad;

    // Apply SVG filter adjustments for Shadows/Highlights
    // We use gamma exponent for shadows and amplitude for highlights (simplified)
    const shadowGamma = 1 - (shad / 200); // shad up -> gamma down -> brightens shadows
    const highlightAmp = 1 + (high / 200); // high up -> amplitude up -> brightens highlights

    ['funcR', 'funcG', 'funcB'].forEach(id => {
        const el = document.getElementById(id);
        el.setAttribute('exponent', shadowGamma);
        el.setAttribute('amplitude', highlightAmp);
    });

    // Apply Tint & Temperature Matrix
    const tintVal = parseFloat(tint) / 100;
    const tempVal = parseFloat(temp) / 100;
    const tintMatrix = document.getElementById('tintMatrix');
    
    // Temperature: Boost R/G for warm, B for cool
    // Tint: Boost R/B for magenta, G for green
    const rMod = 1 + tempVal;
    const gMod = 1 - tintVal;
    const bMod = 1 - tempVal;

    tintMatrix.setAttribute('values', `
        ${rMod} 0 0 0 0
        0 ${gMod} 0 0 0
        0 0 ${bMod} 0 0
        0 0 0 1 0
    `);

    // Apply CSS filters
    // We combine Saturation and Vibrance for the saturate() filter
    const totalSat = (parseFloat(sat) * parseFloat(vib)) / 100;
    practiceImg.style.filter = `brightness(${exp}%) contrast(${con}%) saturate(${totalSat}%) url(#advancedPhotoFilter)`;
}

document.getElementById('resetEdit').addEventListener('click', () => {
    document.getElementById('edit-exp').value = 100;
    document.getElementById('edit-con').value = 100;
    document.getElementById('edit-temp').value = 0;
    document.getElementById('edit-vib').value = 100;
    document.getElementById('edit-sat').value = 100;
    document.getElementById('edit-tint').value = 0;
    document.getElementById('edit-high').value = 0;
    document.getElementById('edit-shad').value = 0;
    
    // Update all slider tracks
    document.querySelectorAll('.practice-card input[type="range"]').forEach(input => {
        updateSliderTrack(input);
    });
    
    updateImageFilters();
});

function updateSliderTrack(input) {
    const min = input.min || 0;
    const max = input.max || 100;
    const val = input.value;
    const percent = (val - min) / (max - min) * 100;
    input.style.background = `linear-gradient(90deg, var(--accent) 0%, var(--accent) ${percent}%, var(--border) ${percent}%, var(--border) 100%)`;
}

// Listeners
document.querySelectorAll('input[type="range"], select').forEach(input => {
    if (input.type === 'range') updateSliderTrack(input);
    input.addEventListener('input', () => {
        if (input.type === 'range') updateSliderTrack(input);
        if (input.id.startsWith('edit')) {
            updateImageFilters();
        } else {
            draw();
        }
    });
});

// Initial renders
draw();
updateImageFilters();

// Responsive handling
window.addEventListener('resize', () => {
    resizeCanvas();
    generateStars();
    generateClouds();
    draw();
});
