console.log("app.js loaded!");

// ---------- STATE ----------

const state = {
  anglePreset: 15,
  bottomDepth: 30,
  fishDepth: 12,
};
const canvas = document.getElementById('coneCanvas');
const ctx = canvas.getContext('2d');
const appContainer = document.getElementById('appContainer');

let coneAngle = state.anglePreset; // kept in sync with preset

// ---------- ELEMENTS ----------

const bottomDepthSlider = document.getElementById("bottomDepth");
const bottomDepthNumber = document.getElementById("bottomDepthNumber");

const fishDepthSlider = document.getElementById("fishDepth");
const fishDepthNumber = document.getElementById("fishDepthNumber");

const bottomRadiusValue = document.getElementById("bottomRadiusValue");
const fishRadiusValue = document.getElementById("fishRadiusValue");

const diagramMode = document.getElementById("diagramMode");
const coneCanvas = document.getElementById("coneCanvas");

const infoButton = document.getElementById("infoButton");
const infoOverlay = document.getElementById("infoOverlay");
const closeInfoButton = document.getElementById("closeInfoButton");

// ---------- MATH ----------

function radius(depth, angleDeg) {
  // R = depth * tan(angle/2)
  return depth * Math.tan((angleDeg * Math.PI) / 360);
}

function getSafeFishDepth() {
  return Math.min(state.fishDepth, state.bottomDepth);
}

// ---------- UI UPDATE ----------

function updateUI() {
  coneAngle = state.anglePreset;

  const safeFishDepth = getSafeFishDepth();

  const bottomR = radius(state.bottomDepth, coneAngle);
  const fishR = radius(safeFishDepth, coneAngle);

  bottomRadiusValue.textContent = bottomR.toFixed(2) + " ft";
  fishRadiusValue.textContent = fishR.toFixed(2) + " ft";

  // Keep UI controls in sync with state
  bottomDepthSlider.value = state.bottomDepth;
  bottomDepthNumber.value = state.bottomDepth;

  fishDepthSlider.value = state.fishDepth;
  fishDepthNumber.value = state.fishDepth;

  drawCone(bottomR, fishR, safeFishDepth);
}

// ---------- DEPTH UPDATE HELPERS ----------

function updateBottomDepth(value) {
  const v = Number(value);
  if (Number.isNaN(v) || v <= 0) return;

  state.bottomDepth = v;

  // Clamp fish to bottom
  if (state.fishDepth > state.bottomDepth) {
    state.fishDepth = state.bottomDepth;
  }

  updateUI();
}

function updateFishDepth(value) {
  const v = Number(value);
  if (Number.isNaN(v) || v <= 0) return;

  // Clamp to bottom depth
  state.fishDepth = Math.min(v, state.bottomDepth);

  updateUI();
}

// ---------- DRAWING ----------

function drawCone(bottomRadius, fishRadius, safeFishDepth) {
  if (!coneCanvas || !coneCanvas.getContext) return;
  const ctx = coneCanvas.getContext("2d");
  const width = coneCanvas.width;
  const height = coneCanvas.height;

  ctx.clearRect(0, 0, width, height);

  const mode = diagramMode.value;

  const topX = width / 2;
  const topY = 20;
  const bottomY = height * 0.9;

  // Scale cone width
  const maxR = Math.max(bottomRadius, fishRadius, 1);
  const scaleFactor = (width * 0.40) / maxR;

  let bottomOffset = bottomRadius * scaleFactor;

  // Limit cone width so depth labels never clip
  const MAX_BOTTOM_OFFSET = width * 0.30;
  if (bottomOffset > MAX_BOTTOM_OFFSET) {
    bottomOffset = MAX_BOTTOM_OFFSET;
  }

  // Fish Y position
  const fishY = topY + (safeFishDepth / state.bottomDepth) * (bottomY - topY);
  
  // Fish X position (always centered)
  const fishX = topX;
  
  // Cone half-width at fish depth (correct taper)
  const tFish = safeFishDepth / state.bottomDepth;
  const fishOffset = bottomOffset * tFish;

  // ----- Enhanced gradient -----
  if (mode === "enhanced") {
    const gradient = ctx.createLinearGradient(topX, topY, topX, bottomY);
    gradient.addColorStop(0, "rgba(0, 122, 255, 0.25)");
    gradient.addColorStop(1, "rgba(0, 122, 255, 0.05)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(topX - bottomOffset, bottomY);
    ctx.lineTo(topX + bottomOffset, bottomY);
    ctx.closePath();
    ctx.fill();
  }

  // ----- Cone edges -----
  ctx.strokeStyle = "#007aff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(topX, topY);
  ctx.lineTo(topX - bottomOffset, bottomY);
  ctx.moveTo(topX, topY);
  ctx.lineTo(topX + bottomOffset, bottomY);
  ctx.stroke();

  // ----- ARC (perfectly aligned with cone boundaries) -----
  if (mode === "enhanced") {
    // Arc height = 10% down the cone
    const tArc = 0.10;
    const arcY = topY + (bottomY - topY) * tArc;

    // Cone half-width at arc height
    const arcHalfWidth = bottomOffset * tArc;

    // Arc radius = vertical distance from apex
    const arcRadius = arcY - topY;

    // Compute exact angles so arc hits cone edges
    const arcStart = Math.atan2( arcHalfWidth, arcRadius ) + Math.PI/2;
    const arcEnd   = Math.atan2(-arcHalfWidth, arcRadius ) + Math.PI/2;

    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(topX, topY, arcRadius, arcStart, arcEnd, true);
    ctx.stroke();

    // Angle label
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#007aff";
    ctx.textAlign = "center";
    ctx.fillText(`${coneAngle}\u00B0`, topX, arcY + 15);
  }

  // ----- Depth scale -----
  if (mode === "enhanced") {
    ctx.strokeStyle = "#444";
    ctx.fillStyle = "#444";
    ctx.lineWidth = 1;
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";

    const ticks = 5;
    for (let i = 0; i <= ticks; i++) {
      const t = i / ticks;
      const y = topY + t * (bottomY - topY);
      const depth = (t * state.bottomDepth).toFixed(0);

      ctx.beginPath();
      ctx.moveTo(topX - bottomOffset - 20, y);
      ctx.lineTo(topX - bottomOffset - 10, y);
      ctx.stroke();

      ctx.fillText(`${depth} ft`, topX - bottomOffset - 25, y + 4);
    }
  }

  // ----- Fish radius line (now perfectly aligned with cone edges) -----
  ctx.strokeStyle = "#34c759";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(topX - fishOffset, fishY);
  ctx.lineTo(topX + fishOffset, fishY);
  ctx.stroke();

  // Fish markers
  ctx.fillStyle = "#34c759";
  ctx.beginPath();
  ctx.arc(topX - fishOffset, fishY, 4, 0, Math.PI * 2);
  ctx.arc(topX + fishOffset, fishY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Stylized fish icon (facing RIGHT)
  if (mode === "enhanced") {
    
    
    // --- Fish body ---
    ctx.fillStyle = "#0077cc";
    
    const fishOffsetX = -12;   // your tuned spacing
    
    // BODY (tapered left, nose on the right)
    const bodyLeftX  = fishX - fishOffsetX;
    const bodyMidX   = bodyLeftX + 10;
    const noseX      = bodyLeftX + 16;
    
    // Soft shadow under fish (fish-sized, not cone-sized)
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.filter = "blur(3px)";
    
    // Compute fish center X (bodyLeftX + half body length)
    const fishCenterX = bodyLeftX + 8;    // Shadow sized to the fish icon, not the cone width

    // Shadow sized to the fish icon
    const shadowWidth = 12;   // width of shadow ellipse
    const shadowHeight = 4;   // subtle vertical thickness
    
    ctx.beginPath();
    ctx.ellipse(fishCenterX, fishY + 6, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();

    // --- Draw fish body ---
    ctx.beginPath();
    ctx.moveTo(bodyLeftX, fishY);
    ctx.lineTo(bodyMidX, fishY - 5);
    ctx.lineTo(noseX, fishY);
    ctx.lineTo(bodyMidX, fishY + 5);
    ctx.closePath();
    ctx.fill();
    
    // TAIL (triangle with TIP pointing RIGHT)
    ctx.beginPath();
    const tailBaseX = bodyLeftX - 4;
    const tailTipX  = tailBaseX + 6;
    
    ctx.moveTo(tailBaseX, fishY - 4);
    ctx.lineTo(tailBaseX, fishY + 4);
    ctx.lineTo(tailTipX, fishY);
    ctx.closePath();
    ctx.fill();
    
    // EYE
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(fishX - fishOffsetX + 12, fishY - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ----- Bottom contour -----
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(topX - bottomOffset, bottomY);
  ctx.quadraticCurveTo(topX, bottomY + 8, topX + bottomOffset, bottomY);
  ctx.stroke();

  // Bottom markers
  ctx.fillStyle = "#888";
  ctx.beginPath();
  ctx.arc(topX - bottomOffset, bottomY, 4, 0, Math.PI * 2);
  ctx.arc(topX + bottomOffset, bottomY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Bottom label
  if (mode === "enhanced") {
    ctx.fillStyle = "#555";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Bottom Radius: ${bottomRadius.toFixed(2)} ft`, topX, bottomY - 12);
  }
}


// ---------- EVENT WIRING ----------

// Angle preset radios
document.querySelectorAll('input[name="anglePreset"]').forEach(radio => {
  radio.addEventListener("change", e => {
    state.anglePreset = parseFloat(e.target.value);
    updateUI();
  });
});

// Bottom depth controls
bottomDepthSlider.addEventListener("input", e =>
  updateBottomDepth(e.target.value)
);
bottomDepthNumber.addEventListener("input", e =>
  updateBottomDepth(e.target.value)
);

// Fish depth controls
fishDepthSlider.addEventListener("input", e =>
  updateFishDepth(e.target.value)
);
fishDepthNumber.addEventListener("input", e =>
  updateFishDepth(e.target.value)
);

// Diagram mode
diagramMode.addEventListener("change", updateUI);

// Info overlay
infoButton.addEventListener("click", () => {
  infoOverlay.classList.remove("hidden");
});

closeInfoButton.addEventListener("click", () => {
  infoOverlay.classList.add("hidden");
});

infoOverlay.addEventListener("click", e => {
  if (e.target === infoOverlay) {
    infoOverlay.classList.add("hidden");
  }
});

// ---------- INITIAL RENDER ----------

updateUI();

// === Canvas Auto-Resize ===
function resizeCanvas() {
    const canvas = document.getElementById('coneCanvas');
    const controls = document.getElementById('controls');
    const appContainer = document.getElementById('appContainer');

    canvas.width = appContainer.clientWidth;
    canvas.height = appContainer.clientHeight - controls.clientHeight;

    updateUI(); // now safe because updateUI is defined above
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);

// Run after everything is defined
window.addEventListener('load', resizeCanvas);

