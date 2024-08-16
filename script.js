const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pumpButton = document.getElementById('pumpButton');

canvas.width = 1500;
canvas.height = 600;

const images = {
    pump: loadImage('assets/pump.png'),
    cloud: loadImage('assets/cloud.png'),
    background: loadImage('assets/background.png'),
    string: loadImage('assets/string.png'),
    //Different coloured balloons
    balloonRed: loadImage('assets/red.png'),
    balloonBlue: loadImage('assets/blue.png'),
    balloonGreen: loadImage('assets/green.png'),
    balloonOrange: loadImage('assets/orange.png'),
    balloonHotPink: loadImage('assets/hotpink.png'),
    balloonDarkblue: loadImage('assets/darkblue.png'),
    balloonDullpink: loadImage('assets/dullpink.png'),
    balloonDullyellow: loadImage('assets/dullyellow.png'),
};

const balloonColors = [
    images.balloonRed,
    images.balloonBlue,
    images.balloonGreen,
    images.balloonOrange,
    images.balloonHotPink,
    images.balloonDarkblue,
    images.balloonDullpink,
    images.balloonDullyellow,
];

let balloons = [];
let isPumping = false;
let assetsLoaded = false;
let balloonIndex = 0;  // Index to keep track of the current balloon color

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Function to load images
function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

// Function to check if all images have loaded
function checkAssetsLoaded() {
    let loaded = true;
    for (let key in images) {
        if (!images[key].complete) {
            loaded = false;
            break;
        }
    }
    if (loaded) {
        assetsLoaded = true;
        update();
    } else {
        requestAnimationFrame(checkAssetsLoaded);
    }
}

// Create a new balloon and make it emerge from the pump
function createBalloon() {
    if (balloonIndex >= balloonColors.length) {
        balloonIndex = 0; // Reset index if we exceed available colors
    }

    const newBalloon = {
        x: canvas.width - 60, // Start near the pump
        y: canvas.height - 150,
        width: 50,
        height: 50,
        maxScale: 2.0,
        scale: 0.5, // Start small
        isBurst: false,
        dx: 0,
        dy: -1, // Start moving up slowly
        color: balloonColors[balloonIndex],
        letter: alphabet[balloonIndex % alphabet.length], // Assign a letter
        isFlying: false,
        rotation: 0,
        opacity: 1,
        popping: false,
        confetti: [],
        inflateSpeed: 0.02, // Speed of inflation
        maxInflateHeight: canvas.height - 250 // Stop inflating at a certain height
    };

    balloons.push(newBalloon);
    balloonIndex++;
}

function drawBackground() {
    ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
}

// Animate clouds moving across the screen
function drawClouds() {
    const cloudPositions = [
        { x: (Date.now() / 30) % canvas.width - 150, y: 50 },
        { x: (Date.now() / 60) % canvas.width - 250, y: 120 },
        { x: (Date.now() / 90) % canvas.width - 350, y: 200 },
        { x: (Date.now() / 120) % canvas.width - 450, y: 300 },  // Additional clouds
        { x: (Date.now() / 30) % canvas.width - 550, y: 400 },  // Additional clouds
    ];
    cloudPositions.forEach(pos => {
        ctx.drawImage(images.cloud, pos.x, pos.y, 100, 90); // Increase cloud size
    });
}

// Draw the string for each balloon
function drawString(balloon) {
    if (!balloon.isBurst) {
        ctx.drawImage(images.string, balloon.x - 10, balloon.y - 10, 20, balloon.height);
    }
}

// Draw each balloon with the assigned letter
function drawBalloons() {
    balloons.forEach(balloon => {
        if (!balloon.isBurst) {
            ctx.save();
            ctx.translate(balloon.x, balloon.y);
            ctx.scale(balloon.scale, balloon.scale);
            ctx.rotate(balloon.rotation);
            ctx.globalAlpha = balloon.opacity;
            ctx.drawImage(balloon.color, -balloon.width / 2, -balloon.height / 2, balloon.width, balloon.height);
            ctx.restore();

            // Draw the letter on the balloon
            ctx.font = '20px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(balloon.letter, balloon.x, balloon.y + 7);

            drawString(balloon);
        } else if (balloon.popping) {
            drawConfetti(balloon.confetti);
        }
    });
}

// Inflate the balloon as it rises from the pump
function inflateBalloon(balloon) {
    if (balloon.scale < balloon.maxScale && balloon.y > balloon.maxInflateHeight) {
        balloon.scale += balloon.inflateSpeed;
        balloon.y -= 2; // Move upwards while inflating
    } else if (!balloon.isFlying) {
        startFlying(balloon);
    }
}

// Start flying each balloon with even slower, random directions
function startFlying(balloon) {
    balloon.dx = (Math.random() * 0.5) - 0.25;  // Smaller random horizontal movement
    balloon.dy = -Math.random() * 0.5 - 0.25;   // Smaller upward movement
    balloon.isFlying = true;
}

// Bobbing effect for balloons
function updateBobbing(balloon) {
    if (!balloon.isBurst && balloon.isFlying) {
        balloon.y += Math.sin(Date.now() / 200) * 2;
    }
}

// Smoothly pop the balloon with confetti effect
function burstBalloon(balloon) {
    if (!balloon.isBurst && !balloon.popping) {
        balloon.isBurst = true;
        balloon.popping = true;

        // Create confetti for all balloons
        balloon.confetti = createConfetti(balloon.x, balloon.y);

        // Confetti burst only
        let confettiInterval = setInterval(() => {
            updateConfetti(balloon.confetti);
            if (balloon.confetti.length === 0) {
                clearInterval(confettiInterval);
            }
        }, 30);
    }
}

// Confetti effect
function createConfetti(x, y) {
    let confetti = [];
    for (let i = 0; i < 30; i++) {
        confetti.push({
            x: x,
            y: y,
            dx: Math.random() * 4 - 2,
            dy: Math.random() * 4 - 2,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            size: Math.random() * 5 + 2,
            life: Math.random() * 50 + 50
        });
    }
    return confetti;
}

function updateConfetti(confetti) {
    confetti.forEach((piece, index) => {
        piece.x += piece.dx;
        piece.y += piece.dy;
        piece.dy += 0.1; // Gravity effect
        piece.life -= 1;

        if (piece.life <= 0) {
            confetti.splice(index, 1); // Remove confetti piece when its life ends
        }
    });
}

function drawConfetti(confetti) {
    confetti.forEach(piece => {
        ctx.fillStyle = piece.color;
        ctx.fillRect(piece.x, piece.y, piece.size, piece.size);
    });
}

function drawPump() {
    if (isPumping) {
        ctx.drawImage(images.pump, canvas.width - 110, canvas.height - 180, 100, 120); // Increase pump size
    } else {
        ctx.drawImage(images.pump, canvas.width - 110, canvas.height - 170, 100, 120); // Increase pump size
    }
}

function update() {
    if (!assetsLoaded) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawClouds();

    balloons.forEach(balloon => {
        if (!balloon.isBurst) {
            balloon.x += balloon.dx;
            balloon.y += balloon.dy;

            inflateBalloon(balloon); // Inflate the balloon while it rises

            if (balloon.x + balloon.width * balloon.scale > canvas.width || balloon.x - balloon.width * balloon.scale < 0) {
                balloon.dx = -balloon.dx;
            }
            if (balloon.y + balloon.height * balloon.scale > canvas.height || balloon.y - balloon.height * balloon.scale < 0) {
                balloon.dy = -balloon.dy;
            }

            updateBobbing(balloon);
        }
    });

    drawBalloons();
    drawPump();
    requestAnimationFrame(update);
}

pumpButton.addEventListener('mousedown', () => {
    isPumping = true;
    createBalloon(); // Create a new balloon when pumping starts
});

pumpButton.addEventListener('mouseup', () => {
    isPumping = false;
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    balloons.forEach(balloon => {
        const distX = mouseX - balloon.x;
        const distY = mouseY - balloon.y;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance <= balloon.width * balloon.scale / 2) {
            burstBalloon(balloon);
        }
    });
});

checkAssetsLoaded();

