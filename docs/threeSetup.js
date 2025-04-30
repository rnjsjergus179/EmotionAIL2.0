import * as THREE from 'three';

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
export const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("canvas") || document.createElement("canvas"),
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.set(10, 10, 20);
camera.lookAt(0, 0, 0);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7).normalize();
scene.add(directionalLight);
scene.add(new THREE.AmbientLight(0x333333));

export const sunMaterial = new THREE.MeshStandardMaterial({
  color: 0xffcc00,
  emissive: 0xff9900,
  transparent: true,
  opacity: 0
});
export const sun = new THREE.Mesh(new THREE.SphereGeometry(1.5, 64, 64), sunMaterial);
scene.add(sun);

export const moonMaterial = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  emissive: 0x222222,
  transparent: true,
  opacity: 1
});
export const moon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 64), moonMaterial);
scene.add(moon);

export const stars = [];
export const fireflies = [];
for (let i = 0; i < 200; i++) {
  const star = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  star.position.set((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 60, -20);
  scene.add(star);
  stars.push(star);
}
for (let i = 0; i < 60; i++) {
  const firefly = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffff99 }));
  firefly.position.set((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 20, -10);
  scene.add(firefly);
  fireflies.push(firefly);
}

const floorGeometry = new THREE.PlaneGeometry(400, 400, 128, 128);
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x808080,
  roughness: 1,
  metalness: 0
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2;
scene.add(floor);

const backgroundGroup = new THREE.Group();
scene.add(backgroundGroup);

function createBuilding(width, height, depth, color) {
  const buildingGroup = new THREE.Group();
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.7,
    metalness: 0.1
  });
  const building = new THREE.Mesh(geometry, material);
  buildingGroup.add(building);

  const windowMat = new THREE.MeshStandardMaterial({ color: 0x87CEEB });
  for (let y = 3; y < height - 1; y += 2) {
    for (let x = -width / 2 + 0.5; x < width / 2; x += 1) {
      const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.1), windowMat);
      windowMesh.position.set(x, y - height / 2, depth / 2 + 0.01);
      buildingGroup.add(windowMesh);
    }
  }

  const doorMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1), doorMat);
  door.position.set(0, -height / 2 + 1, depth / 2 + 0.01);
  buildingGroup.add(door);
  return buildingGroup;
}

function createHouse(width, height, depth, baseColor, roofColor) {
  const houseGroup = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.8 })
  );
  base.position.y = -2 + height / 2;
  houseGroup.add(base);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(width * 0.8, height * 0.6, 4),
    new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.8 })
  );
  roof.position.y = -2 + height + (height * 0.6) / 2;
  roof.rotation.y = Math.PI / 4;
  houseGroup.add(roof);

  const windowMat = new THREE.MeshStandardMaterial({ color: 0xFFFFE0 });
  const window1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), windowMat);
  window1.position.set(-width / 4, -2 + height / 2, depth / 2 + 0.01);
  const window2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), windowMat);
  window2.position.set(width / 4, -2 + height / 2, depth / 2 + 0.01);
  houseGroup.add(window1, window2);

  const doorMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.1), doorMat);
  door.position.set(0, -2 + height / 4, depth / 2 + 0.01);
  houseGroup.add(door);
  return houseGroup;
}

for (let i = 0; i < 20; i++) {
  const width = Math.random() * 4 + 4;
  const height = Math.random() * 20 + 20;
  const depth = Math.random() * 4 + 4;
  const building = createBuilding(width, height, depth, 0x555555);
  const col = i % 10;
  const row = Math.floor(i / 10);
  const x = -50 + col * 10;
  const z = -30 - row * 20;
  building.position.set(x, -2 + height / 2, z);
  backgroundGroup.add(building);
}
for (let i = 0; i < 10; i++) {
  const width = Math.random() * 4 + 6;
  const height = Math.random() * 4 + 6;
  const depth = Math.random() * 4 + 6;
  const house = createHouse(width, height, depth, 0xa0522d, 0x8b0000);
  const x = -40 + i * 10;
  const z = -10;
  house.position.set(x, 0, z);
  backgroundGroup.add(house);
}

function createStreetlight() {
  const lightGroup = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 4, 8),
    new THREE.MeshBasicMaterial({ color: 0x333333 })
  );
  pole.position.y = 2;
  lightGroup.add(pole);

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffcc00 })
  );
  lamp.position.y = 4.2;
  lightGroup.add(lamp);

  const lampLight = new THREE.PointLight(0xffcc00, 1, 10);
  lampLight.position.set(0, 4.2, 0);
  lightGroup.add(lampLight);
  return lightGroup;
}
export const characterStreetlight = createStreetlight();
characterStreetlight.position.set(1, -2, 0);
scene.add(characterStreetlight);

export let rainGroup = new THREE.Group();
scene.add(rainGroup);

function initRain() {
  const rainCount = 2000;
  const rainGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    positions[i * 3] = Math.random() * 200 - 100;
    positions[i * 3 + 1] = Math.random() * 100;
    positions[i * 3 + 2] = Math.random() * 200 - 100;
  }
  rainGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const rainMaterial = new THREE.PointsMaterial({
    color: 0xaaaaee,
    size: 0.1,
    transparent: true,
    opacity: 0.6
  });
  const rainParticles = new THREE.Points(rainGeometry, rainMaterial);
  rainGroup.add(rainParticles);
}
initRain();
rainGroup.visible = false;

export let houseCloudGroup = new THREE.Group();
scene.add(houseCloudGroup);

function createHouseCloud() {
  const cloud = new THREE.Group();
  const cloudMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9
  });
  const sphere1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), cloudMat);
  sphere1.position.set(0, 0, 0);
  const sphere2 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), cloudMat);
  sphere2.position.set(0.6, 0.2, 0);
  const sphere3 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), cloudMat);
  sphere3.position.set(-0.6, 0.1, 0);
  cloud.add(sphere1, sphere2, sphere3);
  cloud.scale.set(2, 2, 2);
  cloud.userData.initialPos = cloud.position.clone();
  return cloud;
}
const singleCloud = createHouseCloud();
houseCloudGroup.add(singleCloud);
houseCloudGroup.position.set(0, 2, 0);

export let cloudRainGroup = new THREE.Group();
function initCloudRain() {
  const cloudRainCount = 100;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(cloudRainCount * 3);
  for (let i = 0; i < cloudRainCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 1.5;
    positions[i * 3 + 1] = Math.random() * 0.2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xaaaaee,
    size: 0.05,
    transparent: true,
    opacity: 0.8
  });
  const particles = new THREE.Points(geometry, material);
  cloudRainGroup.add(particles);
}
initCloudRain();
cloudRainGroup.visible = false;
houseCloudGroup.add(cloudRainGroup);

export let lightningLight = new THREE.PointLight(0xffffff, 0, 500);
lightningLight.position.set(0, 50, 0);
scene.add(lightningLight);

export const characterGroup = new THREE.Group();
const charBody = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1.5, 0.5),
  new THREE.MeshStandardMaterial({ color: 0x00cc66 })
);
export const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xffcc66 })
);
head.position.y = 1.2;

const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), eyeMat);
const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), eyeMat);
leftEye.position.set(-0.2, 1.3, 0.45);
rightEye.position.set(0.2, 1.3, 0.45);

const mouth = new THREE.Mesh(
  new THREE.BoxGeometry(0.2, 0.05, 0.05),
  new THREE.MeshStandardMaterial({ color: 0xff3366 })
);
mouth.position.set(0, 1.1, 0.51);

const leftBrow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.05), eyeMat);
const rightBrow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.05), eyeMat);
leftBrow.position.set(-0.2, 1.45, 0.45);
rightBrow.position.set(0.2, 1.45, 0.45);

const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), charBody.material);
const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), charBody.material);
leftArm.position.set(-0.7, 0.4, 0);
rightArm.position.set(0.7, 0.4, 0);

const legMat = new THREE.MeshStandardMaterial({ color: 0x3366cc });
const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), legMat);
const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), legMat);
leftLeg.position.set(-0.35, -1, 0);
rightLeg.position.set(0.35, -1, 0);

characterGroup.add(
  charBody,
  head,
  leftEye,
  rightEye,
  mouth,
  leftBrow,
  rightBrow,
  leftArm,
  rightArm,
  leftLeg,
  rightLeg
);
characterGroup.position.y = -1;
scene.add(characterGroup);

export const characterLight = new THREE.PointLight(0xffee88, 1, 15);
scene.add(characterLight);

function createTree() {
  const treeGroup = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 2, 16),
    new THREE.MeshStandardMaterial({ color: 0x8B4513 })
  );
  trunk.position.y = -1;

  const foliage = new THREE.Mesh(
    new THREE.ConeGeometry(1, 3, 16),
    new THREE.MeshStandardMaterial({ color: 0x228B22 })
  );
  foliage.position.y = 0.5;

  treeGroup.add(trunk, foliage);
  return treeGroup;
}
for (let i = 0; i < 10; i++) {
  const tree = createTree();
  tree.position.set(-50 + i * 10, -2, -15);
  scene.add(tree);
}

export function updateWeatherEffects(currentWeather) {
  if (!currentWeather || typeof rainGroup === 'undefined' || typeof cloudRainGroup === 'undefined' || typeof houseCloudGroup === 'undefined') return;
  if (currentWeather.includes("비") || currentWeather.includes("소나기")) {
    rainGroup.visible = true;
    cloudRainGroup.visible = true;
  } else {
    rainGroup.visible = false;
    cloudRainGroup.visible = false;
  }
  if (currentWeather.includes("구름") || currentWeather.includes("흐림")) {
    houseCloudGroup.visible = true;
  } else {
    houseCloudGroup.visible = false;
  }
}

export function updateLightning(currentWeather) {
  if (!currentWeather || typeof lightningLight === 'undefined') return;
  if (currentWeather.includes("번개") || currentWeather.includes("뇌우")) {
    if (Math.random() < 0.001) {
      lightningLight.intensity = 5;
      setTimeout(() => { lightningLight.intensity = 0; }, 100);
    }
  }
}

export function updateHouseClouds() {
  if (typeof head === 'undefined' || head === null || typeof head.getWorldPosition !== "function") return;
  const headWorldPos = new THREE.Vector3();
  try {
    head.getWorldPosition(headWorldPos);
  } catch (err) {
    console.error("updateHouseClouds 에러:", err);
    return;
  }
  houseCloudGroup.position.x = headWorldPos.x + Math.sin(Date.now() * 0.001) * 1;
  houseCloudGroup.position.y = headWorldPos.y + 2.5;
  houseCloudGroup.position.z = headWorldPos.z;
}

export function updateBubblePosition() {
  const bubble = document.getElementById("speech-bubble");
  if (!bubble) return;
  if (typeof head === 'undefined' || head === null || typeof head.getWorldPosition !== "function") return;
  const headWorldPos = new THREE.Vector3();
  try {
    head.getWorldPosition(headWorldPos);
  } catch (err) {
    console.error("updateBubblePosition 에러:", err);
    return;
  }
  const screenPos = headWorldPos.project(camera);
  bubble.style.left = ((screenPos.x * 0.5 + 0.5) * window.innerWidth) + "px";
  bubble.style.top = ((1 - (screenPos.y * 0.5 + 0.5)) * window.innerHeight - 50) + "px";
}

export function animate(characterGroup, characterStreetlight, characterLight, stars, fireflies, sun, moon, head, camera) {
  requestAnimationFrame(() => animate(characterGroup, characterStreetlight, characterLight, stars, fireflies, sun, moon, head, camera));
  const now = new Date();
  const headWorldPos = new THREE.Vector3();
  try {
    if (typeof head !== 'undefined' && head !== null && typeof head.getWorldPosition === "function") {
      head.getWorldPosition(headWorldPos);
    }
  } catch (err) {
    console.error("애니메이트 중 head.getWorldPosition 에러:", err);
  }

  const totalMin = now.getHours() * 60 + now.getMinutes();
  const angle = (totalMin / 1440) * Math.PI * 2;
  const radius = 3;

  const sunPos = new THREE.Vector3(
    headWorldPos.x + Math.cos(angle) * radius,
    headWorldPos.y + Math.sin(angle) * radius,
    headWorldPos.z
  );
  sun.position.copy(sunPos);

  const moonAngle = angle + Math.PI;
  const moonPos = new THREE.Vector3(
    headWorldPos.x + Math.cos(moonAngle) * radius,
    headWorldPos.y + Math.sin(moonAngle) * radius,
    headWorldPos.z
  );
  moon.position.copy(moonPos);

  const t = now.getHours() + now.getMinutes() / 60;
  let sunOpacity = 0, moonOpacity = 0;
  if (t < 6) {
    sunOpacity = 0;
    moonOpacity = 1;
  } else if (t < 7) {
    let factor = t - 6;
    sunOpacity = factor;
    moonOpacity = 1 - factor;
  } else if (t < 17) {
    sunOpacity = 1;
    moonOpacity = 0;
  } else if (t < 18) {
    let factor = t - 17;
    sunOpacity = 1 - factor;
    moonOpacity = factor;
  } else {
    sunOpacity = 0;
    moonOpacity = 1;
  }
  sun.material.opacity = sunOpacity;
  moon.material.opacity = moonOpacity;

  const isDay = (t >= 7 && t < 17);
  scene.background = new THREE.Color(isDay ? 0x87CEEB : 0x000033);

  stars.forEach(s => (s.visible = !isDay));
  fireflies.forEach(f => (f.visible = !isDay));

  characterStreetlight.traverse(child => {
    if (child instanceof THREE.PointLight) {
      child.intensity = isDay ? 0 : 1;
    }
  });
  characterLight.position.copy(characterGroup.position).add(new THREE.Vector3(0, 5, 0));
  characterLight.intensity = isDay ? 0 : 1;

  characterGroup.position.y = -1;
  characterGroup.rotation.x = 0;

  characterStreetlight.position.set(
    characterGroup.position.x + 1,
    -2,
    characterGroup.position.z
  );

  if (cloudRainGroup.visible) {
    const particles = cloudRainGroup.children[0];
    let positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= 0.02;
      if (positions[i + 1] < -0.3) {
        positions[i + 1] = Math.random() * 0.2;
      }
    }
    particles.geometry.attributes.position.needsUpdate = true;
  }

  renderer.render(scene, camera);
}
