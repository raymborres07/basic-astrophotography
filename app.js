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
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#444';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.ellipse(100 + i * 200, 100 + (i % 2) * 50, 150, 60, 0, 0, Math.PI * 2);
            ctx.fill();
        }
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
        message = "Cloud Cover: Impossible to Shoot!";
        color = "var(--error)";
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

    document.getElementById('edit-exp-val').innerText = exp + "%";
    document.getElementById('edit-con-val').innerText = con + "%";
    document.getElementById('edit-temp-val').innerText = temp > 0 ? "+" + temp : temp;
    document.getElementById('edit-vib-val').innerText = vib + "%";

    // Apply CSS filters
    // brightness(exp%) contrast(con%) saturate(vib%) hue-rotate(temp deg)
    practiceImg.style.filter = `brightness(${exp}%) contrast(${con}%) saturate(${vib}%) hue-rotate(${temp}deg)`;
}

document.getElementById('resetEdit').addEventListener('click', () => {
    document.getElementById('edit-exp').value = 100;
    document.getElementById('edit-con').value = 100;
    document.getElementById('edit-temp').value = 0;
    document.getElementById('edit-vib').value = 100;
    updateImageFilters();
});

// Listeners
document.querySelectorAll('input[type="range"], select').forEach(input => {
    input.addEventListener('input', () => {
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
    draw();
});
