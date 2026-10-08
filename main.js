const root = document.documentElement;
const intro = document.getElementById("intro");
const kicker = document.getElementById("kicker");
const callimg = document.getElementById("callimg");
const playLine = document.getElementById("play-line");

function enter() {
  root.classList.add("in");
}

document.getElementById("enter").addEventListener("click", enter);
if (location.hash) enter();
else if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  setTimeout(enter, 4200);
}

let taps = 0;
document.getElementById("dog").addEventListener("click", () => {
  taps += 1;
  kicker.textContent = taps % 5 === 0 ? "not again." : "woof.";
});

document.getElementById("walk").addEventListener("click", (event) => {
  if (event.target.closest("a, button")) return;
  taps += 1;
  document.getElementById("walk-line").textContent = taps % 5 === 0 ? "not again." : "woof.";
});

document.getElementById("sky").addEventListener("click", () => {
  document.getElementById("sky-line").textContent = "probably nothing.";
});

document.getElementById("poster").addEventListener("click", () => {
  document.getElementById("poster-line").textContent = "who put that there?";
});

let phoneDog = false;
function showPhone(dog) {
  if (matchMedia("(min-width: 800px)").matches) {
    document.getElementById("phone-line").textContent = "oh.";
    return;
  }
  phoneDog = dog;
  callimg.src = dog ? "img/call-dog.jpg" : "img/call-m.jpg";
  document.getElementById("phone-line").textContent = dog ? "woof." : "oh.";
}

document.getElementById("flip").addEventListener("click", () => showPhone(!phoneDog));
callimg.addEventListener("click", () => {
  if (matchMedia("(min-width: 800px)").matches) {
    document.getElementById("phone-line").textContent = "oh.";
    return;
  }
  showPhone(!phoneDog);
});

let lateHits = 0;
function pokeSign() {
  lateHits += 1;
  const line = document.getElementById("comic-line");
  if (lateHits < 2) {
    line.textContent = "probably nothing.";
    return;
  }
  line.textContent = "oh.";
  document.getElementById("secret").scrollIntoView({
    behavior: root.classList.contains("still") ? "auto" : "smooth",
  });
}

document.getElementById("page-sign").addEventListener("click", pokeSign);
document.getElementById("late-sign").addEventListener("click", pokeSign);

const motion = document.getElementById("motion");
motion.addEventListener("click", () => {
  const still = root.classList.toggle("still");
  motion.setAttribute("aria-pressed", still ? "false" : "true");
});

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const face = new Image();
face.src = "img/face.jpg";

const input = { left: false, right: false, pointer: false, tx: 0.5 };
let player = 0.5;
let rocks = [];
let spawnIn = 0.7;
let score = 0;
let cool = 0;
let hits = 0;
let last = 0;

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(rect.width * dpr));
  const h = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function aimFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  input.pointer = true;
  input.tx = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
}

canvas.addEventListener("pointerdown", (event) => {
  canvas.setPointerCapture(event.pointerId);
  aimFromEvent(event);
});
canvas.addEventListener("pointermove", (event) => {
  if (input.pointer) aimFromEvent(event);
});
function endPointer(event) {
  if (canvas.hasPointerCapture && canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
  input.pointer = false;
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);

function hold(button, key) {
  const down = (event) => {
    event.preventDefault();
    input[key] = true;
  };
  const up = () => {
    input[key] = false;
  };
  button.addEventListener("pointerdown", down);
  button.addEventListener("pointerup", up);
  button.addEventListener("pointerleave", up);
  button.addEventListener("pointercancel", up);
}
hold(document.getElementById("pad-left"), "left");
hold(document.getElementById("pad-right"), "right");

addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") input.left = true;
  if (event.key === "ArrowRight") input.right = true;
});
addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") input.left = false;
  if (event.key === "ArrowRight") input.right = false;
});

function circleHitsRect(cx, cy, r, x, y, w, h) {
  const nx = Math.max(x, Math.min(cx, x + w));
  const ny = Math.max(y, Math.min(cy, y + h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

function frame(now) {
  requestAnimationFrame(frame);
  if (!last) last = now;
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  resize();
  const w = canvas.width;
  const h = canvas.height;

  if (input.left) player = Math.max(0.08, player - 1.35 * dt);
  else if (input.right) player = Math.min(0.92, player + 1.35 * dt);
  else if (input.pointer) player += (input.tx - player) * Math.min(1, dt * 12);

  if (cool > 0) cool -= dt;
  else {
    score += dt;
    spawnIn -= dt;
    if (spawnIn <= 0) {
      rocks.push({
        x: 0.08 + Math.random() * 0.74,
        y: -0.12,
        w: 0.16 + Math.random() * 0.08,
        h: 0.045,
      });
      spawnIn = Math.max(0.38, 0.95 - score * 0.02);
    }
    const speed = Math.min(0.72, 0.32 + score * 0.012);
    rocks.forEach((rock) => {
      rock.y += speed * dt;
    });
  }

  const px = player * w;
  const py = h * 0.8;
  const pr = h * 0.07;
  if (cool <= 0) {
    for (const rock of rocks) {
      if (circleHitsRect(px, py, pr * 0.82, rock.x * w, rock.y * h, rock.w * w, rock.h * h)) {
        hits += 1;
        cool = 0.85;
        rocks = [];
        playLine.textContent = hits % 3 === 0 ? "not again." : "oh.";
        score = 0;
        break;
      }
    }
  }
  rocks = rocks.filter((rock) => rock.y < 1.1);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#2a130e");
  sky.addColorStop(0.55, "#e26a22");
  sky.addColorStop(1, "#1a120c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(244,234,212,0.18)";
  const step = Math.max(8, Math.round(h / 48));
  for (let y = 0; y < h; y += step) {
    for (let x = (y / step) % 2 ? 0 : step / 2; x < w; x += step) {
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }

  ctx.fillStyle = "#140e14";
  const ground = h * 0.9;
  ctx.fillRect(0, ground, w, h - ground);
  ctx.fillStyle = "#2a1c28";
  for (let i = 0; i < 9; i += 1) {
    const bx = ((i * 97 + score * 40) % (w + 80)) - 40;
    const bh = h * (0.08 + (i % 3) * 0.03);
    ctx.fillRect(bx, ground - bh, w * 0.06, bh);
    ctx.fillStyle = "#f0c014";
    ctx.fillRect(bx + 6, ground - bh + 8, 3, 4);
    ctx.fillStyle = "#2a1c28";
  }

  rocks.forEach((rock) => {
    const x = rock.x * w;
    const y = rock.y * h;
    const rw = rock.w * w;
    const rh = rock.h * h;
    ctx.fillStyle = "#d8232a";
    ctx.fillRect(x, y, rw, rh);
    ctx.strokeStyle = "#100e12";
    ctx.lineWidth = Math.max(2, h * 0.006);
    ctx.strokeRect(x, y, rw, rh);
  });

  ctx.save();
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.clip();
  if (face.complete && face.naturalWidth) {
    const scale = (pr * 2.15) / face.naturalWidth;
    const dw = face.naturalWidth * scale;
    const dh = face.naturalHeight * scale;
    ctx.drawImage(face, px - dw / 2, py - dh * 0.34, dw, dh);
  } else {
    ctx.fillStyle = "#e23b2f";
    ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  }
  ctx.restore();
  ctx.strokeStyle = "#f4ead4";
  ctx.lineWidth = Math.max(3, h * 0.008);
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#f4ead4";
  ctx.font = `${Math.round(h * 0.06)}px Impact, "Arial Black", sans-serif`;
  ctx.fillText(String(Math.floor(score)), w * 0.06, h * 0.1);
}

requestAnimationFrame(frame);
addEventListener("resize", resize);
