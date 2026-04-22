const canvas = document.getElementById('astroCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// Setup Canvas size
function resizeCanvas() {
    const container = canvas.parentElement;
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
    const colors = [
        '#FFFFFF', // White
        '#FFF4E8', // Warm
        '#E8F4FF', // Cool
        '#FFD2A1', // Reddish
        '#A1D2FF'  // Bluish
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

generateStars();

function draw() {
    const fl = parseFloat(document.getElementById('fl').value);
    const ap = parseFloat(document.getElementById('ap').value);
    const ss = parseFloat(document.getElementById('ss').value);
    const iso = parseFloat(document.getElementById('iso').value);

    // Update UI Labels
    document.getElementById('fl-val').innerText = fl + "mm";
    document.getElementById('ap-val').innerText = "f/" + ap;
    document.getElementById('ss-val').innerText = ss + "s";
    document.getElementById('iso-val').innerText = iso;

    // 500 Rule calculation
    const limit = Math.round(500 / fl);
    document.getElementById('limit-val').innerText = limit + "s";

    // Exposure calculation (simplified for visual representation)
    // Formula: (SS * ISO) / (AP^2 * 100)
    const exposureValue = (ss * iso) / (Math.pow(ap, 2) * 100);
    const normalizedExposure = Math.min(2.5, exposureValue / 20); 

    // Clear Canvas with Sky Color
    const bgBrightness = Math.min(40, normalizedExposure * 15);
    ctx.fillStyle = `rgb(${bgBrightness}, ${bgBrightness * 1.1}, ${bgBrightness * 1.4})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Star Trailing (Earth Rotation)
    // Trail length depends on how much SS exceeds the limit
    const trailAmount = ss > limit ? (ss - limit) * 1.5 : 0;
    const angle = 0.2; // Slight angle for trailing

    stars.forEach(star => {
        const starVisibility = Math.min(1, star.brightness * (normalizedExposure + 0.1));
        
        ctx.globalAlpha = starVisibility;
        ctx.fillStyle = star.color;
        
        if (trailAmount > 0) {
            // Draw Star Trail (Motion Blur)
            ctx.beginPath();
            ctx.lineWidth = star.size;
            ctx.lineCap = 'round';
            ctx.strokeStyle = star.color;
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(star.x + trailAmount, star.y - (trailAmount * angle));
            ctx.stroke();
        } else {
            // Draw Point Star
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    ctx.globalAlpha = 1.0;

    // ISO Noise Simulation (Canvas Pixel Manipulation)
    if (iso >= 1600) {
        applyNoise(iso);
    }

    updateStatus(normalizedExposure, trailAmount, iso);
}

function applyNoise(iso) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    // Higher ISO = more frequent and brighter noise
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

function updateStatus(exposure, trail, iso) {
    const statusEl = document.getElementById('status-msg');
    let message = "Perfect Exposure";
    let color = "var(--success)";

    if (exposure < 0.5) {
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
    }

    statusEl.innerText = message;
    statusEl.style.color = color;
}

// Listeners
document.querySelectorAll('input[type="range"]').forEach(input => {
    input.addEventListener('input', draw);
});

// Initial render
draw();

// Responsive handling
window.addEventListener('resize', () => {
    resizeCanvas();
    generateStars();
    draw();
});
