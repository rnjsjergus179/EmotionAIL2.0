let blockUntil = 0;
let danceInterval;
let currentCity = "서울";
let currentWeather = "";
const regionMap = {
  "서울": "Seoul", "인천": "Incheon", "수원": "Suwon", "고양": "Goyang",
  "성남": "Seongnam", "용인": "Yongin", "부천": "Bucheon", "안양": "Anyang",
  "의정부": "Uijeongbu", "광명": "Gwangmyeong", "안산": "Ansan", "파주": "Paju",
  "부산": "Busan", "대구": "Daegu", "광주": "Gwangju", "대전": "Daejeon",
  "울산": "Ulsan", "제주": "Jeju", "전주": "Jeonju", "청주": "Cheongju",
  "포항": "Pohang", "여수": "Yeosu", "김해": "Gimhae"
};
const regionList = Object.keys(regionMap);
const paymentGuideMessage = `AI: 결제 진행 절차를 안내합니다.<br>
  월 구독은 23,000원, 주간 구독은 16,000원입니다.<br>
  결제할 금액을 입력하세요 (예: 23000 또는 16000).<br>
  <div class="legal-notice">
    <p><strong>법적 고지:</strong></p>
    <ul>
      <li>이 서비스는 1인 개발자에 의해 운영됩니다.</li>
      <li>환불은 수동으로 처리되며, 처리에 3~5일이 소요될 수 있습니다.</li>
      <li>개발자는 이 서비스의 사용으로 인해 발생하는 어떠한 손해 또는 손실에 대해 책임을 지지 않습니다.</li>
    </ul>
  </div>`;

function showSpeechBubbleInChunks(text, chunkSize = 15, delay = 3000) {
  const bubble = document.getElementById("speech-bubble");
  if (!bubble) return;
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  let index = 0;
  function showNextChunk() {
    if (index < chunks.length) {
      bubble.textContent = chunks[index];
      bubble.style.display = "block";
      index++;
      setTimeout(showNextChunk, delay);
    } else {
      setTimeout(() => { bubble.style.display = "none"; }, 3000);
    }
  }
  showNextChunk();
}

document.addEventListener("copy", function(e) {
  e.preventDefault();
  let selectedText = window.getSelection().toString();
  selectedText = selectedText.replace(/API_KEY_PLACEHOLDER/g, "HIDDEN");
  e.clipboardData.setData("text/plain", selectedText);
  if (Date.now() < blockUntil) return;
  blockUntil = Date.now() + 3600000;
  showSpeechBubbleInChunks("1시간 동안 차단됩니다.");
});

function changeRegion(value) {
  currentCity = value;
  updateMap();
  updateWeatherAndEffects();
  showSpeechBubbleInChunks(`지역이 ${value}(으)로 변경되었습니다.`);
}

async function sendChat() {}

function toggleHud2() {
  const hud2 = document.getElementById("hud-2");
  if (!hud2) return;
  if (hud2.classList.contains("show")) {
    hud2.classList.remove("show");
  } else {
    hud2.classList.add("show");
  }
}

function sendHud2Chat() {
  const inputEl = document.getElementById("hud-2-input");
  const logEl = document.getElementById("hud-2-log");
  if (!inputEl || !logEl) return;
  const msg = inputEl.value.trim();
  if (!msg) return;
  const userMsg = document.createElement("p");
  userMsg.style.color = "#333";
  userMsg.textContent = "사용자: " + msg;
  logEl.appendChild(userMsg);
  const resp = document.createElement("p");
  resp.style.color = "#2575fc";
  const cleanedMsg = msg.replace(/,/g, '');
  if (/환불/.test(msg)) {
    resp.innerHTML = "AI: 환불 요청을 위해 QR 코드를 이메일로 보내주세요.";
  } else if (msg.includes("결제 진행 절차") || msg.includes("결제 안내")) {
    resp.innerHTML = paymentGuideMessage;
  } else if (/^\d+$/.test(cleanedMsg)) {
    const amount = parseInt(cleanedMsg);
    if (amount === 23000) {
      resp.innerHTML = `AI: 23,000원을 결제하려면 다음 QR 코드를 스캔하세요.<br>
        <img src="./QR코드.jpg" alt="QR Code for 23000" style="width: 80%; margin-top: 10px; border-radius: 8px;">`;
    } else if (amount === 16000) {
      resp.innerHTML = `AI: 16,000원을 결제하려면 다음 QR 코드를 스캔하세요.<br>
        <img src="./QR%20코드.jpg" alt="QR Code for 16000" style="width: 80%; margin-top: 10px; border-radius: 8px;">`;
    } else {
      resp.textContent = "AI: 잘못된 결제 금액입니다. 23000 또는 16000을 입력하세요.";
    }
  } else if (msg.startsWith("정보:")) {
    const userInfo = msg.slice(3).trim();
    if (userInfo) {
      resp.textContent = `AI: 결제 완료가 확인되었습니다. 입력하신 정보: ${userInfo} (감사합니다.)`;
    } else {
      resp.textContent = "AI: '정보:' 뒤에 이메일 또는 닉네임을 입력해 주세요.";
    }
  } else {
    resp.textContent = "AI: 이해하지 못했습니다. 다시 시도해 주세요.";
  }
  logEl.appendChild(resp);
  logEl.scrollTop = logEl.scrollHeight;
  inputEl.value = "";
}

function showPaymentGuide() {
  const logEl = document.getElementById("hud-2-log");
  if (!logEl) return;
  const resp = document.createElement("p");
  resp.style.color = "#2575fc";
  resp.innerHTML = paymentGuideMessage;
  logEl.appendChild(resp);
  logEl.scrollTop = logEl.scrollHeight;
}

function showRefundGuide() {
  const logEl = document.getElementById("hud-2-log");
  if (!logEl) return;
  const resp = document.createElement("p");
  resp.style.color = "#2575fc";
  resp.innerHTML = "AI: 환불 요청을 위해 QR 코드를 이메일로 보내주세요.";
  logEl.appendChild(resp);
  logEl.scrollTop = logEl.scrollHeight;
}

async function getWeather() {
  try {
    const englishCity = regionMap[currentCity] || "Seoul";
    const url = `/api/weather?city=${encodeURIComponent(englishCity)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("날씨 API 호출 실패");
    const data = await res.json();
    const description = data.weather[0].description;
    const temp = data.main.temp;
    currentWeather = description;
    let extraComment = "";
    if (description.indexOf("흐림") !== -1 || description.indexOf("구름") !== -1) {
      extraComment = " 오늘은 약간 흐린 날씨네요 ☁️";
    } else if (description.indexOf("맑음") !== -1) {
      extraComment = " 오늘은 맑은 날씨네요 ☀️";
    }
    return { message: `오늘 ${currentCity}의 날씨는 ${description}이며, 온도는 ${temp}°C입니다.${extraComment}` };
  } catch (err) {
    currentWeather = "";
    return { message: `날씨 정보를 가져오지 못했습니다: ${currentCity}` };
  }
}

function updateMap() {
  const mapIframe = document.getElementById("map-iframe");
  if (!mapIframe) return;
  const englishCity = regionMap[currentCity] || "Seoul";
  mapIframe.src = `https://www.google.com/maps?q=${encodeURIComponent(englishCity)}&output=embed`;
}

function updateWeatherAndEffects() {
  return getWeather().then(weatherData => {
    showSpeechBubbleInChunks(weatherData.message);
    updateWeatherEffects();
  });
}

function updateWeatherEffects() {
  if (!currentWeather) return;
  if (currentWeather.indexOf("비") !== -1 || currentWeather.indexOf("소나기") !== -1) {
    rainGroup.visible = true;
  } else {
    rainGroup.visible = false;
  }
  if (currentWeather.indexOf("구름") !== -1 || currentWeather.indexOf("흐림") !== -1) {
    houseCloudGroup.visible = true;
  } else {
    houseCloudGroup.visible = false;
  }
}

function updateLightning() {
  if (currentWeather.indexOf("번개") !== -1 || currentWeather.indexOf("뇌우") !== -1) {
    if (Math.random() < 0.001) {
      lightningLight.intensity = 5;
      setTimeout(() => { lightningLight.intensity = 0; }, 100);
    }
  }
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas"), alpha: true });

function onWindowResize() {
  const canvasBox = document.getElementById("three-canvas");
  if (!canvasBox) return;
  const width = canvasBox.clientWidth;
  const height = canvasBox.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener("resize", onWindowResize);

function setupScene() {
  const canvasBox = document.getElementById("three-canvas");
  if (!canvasBox) return;
  renderer.setSize(canvasBox.clientWidth, canvasBox.clientHeight);
  camera.position.set(5, 5, 20); // z 값을 20으로 변경
  camera.lookAt(0, 0, 0);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7).normalize();
  scene.add(directionalLight);
  scene.add(new THREE.AmbientLight(0x333333));
}

const sunMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xff9900, transparent: true, opacity: 0 });
const sun = new THREE.Mesh(new THREE.SphereGeometry(1.5, 64, 64), sunMaterial);
scene.add(sun);

const moonMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, emissive: 0x222222, transparent: true, opacity: 1 });
const moon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 64), moonMaterial);
scene.add(moon);

const stars = [];
for (let i = 0; i < 200; i++) {
  const star = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  star.position.set((Math.random()-0.5)*100, (Math.random()-0.5)*60, -20);
  scene.add(star);
  stars.push(star);
}

const fireflies = [];
for (let i = 0; i < 60; i++) {
  const firefly = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffff99 })
  );
  firefly.position.set((Math.random()-0.5)*40, (Math.random()-0.5)*20, -10);
  scene.add(firefly);
  fireflies.push(firefly);
}

const floorGeometry = new THREE.PlaneGeometry(400, 400, 128, 128);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 1, metalness: 0 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI/2;
floor.position.y = -2;
scene.add(floor);

const backgroundGroup = new THREE.Group();
scene.add(backgroundGroup);

function createBuilding(width, height, depth, color) {
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.1 });
  const building = new THREE.Mesh(geometry, material);
  group.add(building);
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x87CEEB });
  for (let y = 3; y < height - 1; y += 2) {
    for (let x = -width/2 + 0.5; x < width/2; x += 1) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.1), windowMat);
      w.position.set(x, y - height/2, depth/2 + 0.01);
      group.add(w);
    }
  }
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1), doorMat);
  door.position.set(0, -height/2 + 1, depth/2 + 0.01);
  group.add(door);
  return group;
}

for (let i = 0; i < 20; i++) {
  const w = Math.random() * 4 + 4;
  const h = Math.random() * 20 + 20;
  const d = Math.random() * 4 + 4;
  const building = createBuilding(w, h, d, 0x555555);
  const col = i % 10;
  const row = Math.floor(i / 10);
  const x = -50 + col * 10;
  const z = -30 - row * 20;
  building.position.set(x, -2 + h/2, z);
  backgroundGroup.add(building);
}

function createHouse(width, height, depth, baseColor, roofColor) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.8 })
  );
  base.position.y = -2 + height/2;
  group.add(base);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(width * 0.8, height * 0.6, 4),
    new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.8 })
  );
  roof.position.y = -2 + height + (height * 0.6)/2;
  roof.rotation.y = Math.PI/4;
  group.add(roof);
  const windowMat = new THREE.MeshStandardMaterial({ color: 0xFFFFE0 });
  const window1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), windowMat);
  window1.position.set(-width/4, -2 + height/2, depth/2 + 0.01);
  const window2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), windowMat);
  window2.position.set(width/4, -2 + height/2, depth/2 + 0.01);
  group.add(window1, window2);
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.1), doorMat);
  door.position.set(0, -2 + height/4, depth/2 + 0.01);
  group.add(door);
  return group;
}

for (let i = 0; i < 10; i++) {
  const w = Math.random() * 4 + 6;
  const h = Math.random() * 4 + 6;
  const d = Math.random() * 4 + 6;
  const house = createHouse(w, h, d, 0xa0522d, 0x8b0000);
  const x = -40 + i * 10;
  const z = -10;
  house.position.set(x, 0, z);
  backgroundGroup.add(house);
}

function createStreetlight() {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 4, 8),
    new THREE.MeshBasicMaterial({ color: 0x333333 })
  );
  pole.position.y = 2;
  group.add(pole);
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffcc00 })
  );
  lamp.position.y = 4.2;
  group.add(lamp);
  const lampLight = new THREE.PointLight(0xffcc00, 1, 10);
  lampLight.position.set(0, 4.2, 0);
  group.add(lampLight);
  return group;
}

const characterStreetlight = createStreetlight();
characterStreetlight.position.set(1, -2, 0);
scene.add(characterStreetlight);

let rainGroup = new THREE.Group();
scene.add(rainGroup);

function initRain() {
  const rainCount = 2000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    positions[i * 3] = Math.random() * 200 - 100;
    positions[i * 3 + 1] = Math.random() * 100;
    positions[i * 3 + 2] = Math.random() * 200 - 100;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xaaaaee, size: 0.1, transparent: true, opacity: 0.6 });
  const rainParticles = new THREE.Points(geometry, material);
  rainGroup.add(rainParticles);
}
initRain();
rainGroup.visible = false;

let houseCloudGroup = new THREE.Group();

function createHouseCloud() {
  const cloud = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
  const s1 = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 32), mat);
  s1.position.set(0, 0, 0);
  const s2 = new THREE.Mesh(new THREE.SphereGeometry(1.8, 32, 32), mat);
  s2.position.set(2.2, 0.7, 0);
  const s3 = new THREE.Mesh(new THREE.SphereGeometry(2.1, 32, 32), mat);
  s3.position.set(-2.2, 0.5, 0);
  cloud.add(s1, s2, s3);
  cloud.userData.initialPos = cloud.position.clone();
  return cloud;
}

const singleCloud = createHouseCloud();
houseCloudGroup.add(singleCloud);
houseCloudGroup.position.set(0, 10, -20);
scene.add(houseCloudGroup);

function updateHouseClouds() {
  singleCloud.position.x += 0.02;
  if (singleCloud.position.x > 10) singleCloud.position.x = -10;
}

let lightningLight = new THREE.PointLight(0xffffff, 0, 500);
lightningLight.position.set(0, 50, 0);
scene.add(lightningLight);

let characterGroup = new THREE.Group();
const charBody = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1.5, 0.5),
  new THREE.MeshStandardMaterial({ color: 0x00cc66 })
);
const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xffcc66 })
);
head.position.y = 1.2;
let leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), new THREE.MeshBasicMaterial({ color: 0x000000 }));
let rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), new THREE.MeshBasicMaterial({ color: 0x000000 }));
leftEye.position.set(-0.2, 1.3, 0.45);
rightEye.position.set(0.2, 1.3, 0.45);
const mouth = new THREE.Mesh(
  new THREE.BoxGeometry(0.2, 0.05, 0.05),
  new THREE.MeshStandardMaterial({ color: 0xff3366 })
);
mouth.position.set(0, 1.1, 0.51);
let leftBrow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0x000000 }));
let rightBrow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0x000000 }));
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
  charBody, head, leftEye, rightEye, mouth,
  leftBrow, rightBrow, leftArm, rightArm, leftLeg, rightLeg
);
characterGroup.position.y = -1;
scene.add(characterGroup);

const characterLight = new THREE.PointLight(0xffee88, 1, 15);
scene.add(characterLight);

function createTree() {
  const group = new THREE.Group();
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
  group.add(trunk, foliage);
  return group;
}

for (let i = 0; i < 10; i++) {
  const tree = createTree();
  tree.position.set(-50 + i * 10, -2, -15);
  scene.add(tree);
}

function animate() {
  requestAnimationFrame(animate);
  const now = new Date();
  const totalMin = now.getHours() * 60 + now.getMinutes();
  const angle = (totalMin / 1440) * Math.PI * 2;
  const radius = 3;
  const headWorldPos = new THREE.Vector3();
  head.getWorldPosition(headWorldPos);
  sun.position.set(
    headWorldPos.x + Math.cos(angle) * radius,
    headWorldPos.y + Math.sin(angle) * radius,
    headWorldPos.z
  );
  const moonAngle = angle + Math.PI;
  moon.position.set(
    headWorldPos.x + Math.cos(moonAngle) * radius,
    headWorldPos.y + Math.sin(moonAngle) * radius,
    headWorldPos.z
  );
  const t = now.getHours() + now.getMinutes() / 60;
  let sunOpacity = 0, moonOpacity = 0;
  if (t < 6) {
    sunOpacity = 0; moonOpacity = 1;
  } else if (t < 7) {
    let factor = (t - 6);
    sunOpacity = factor; moonOpacity = 1 - factor;
  } else if (t < 17) {
    sunOpacity = 1; moonOpacity = 0;
  } else if (t < 18) {
    let factor = (t - 17);
    sunOpacity = 1 - factor; moonOpacity = factor;
  } else {
    sunOpacity = 0; moonOpacity = 1;
  }
  sun.material.opacity = sunOpacity;
  moon.material.opacity = moonOpacity;
  const isDay = (t >= 7 && t < 17);
  scene.background = new THREE.Color(isDay ? 0x87CEEB : 0x000033);
  stars.forEach(s => s.visible = !isDay);
  fireflies.forEach(f => f.visible = !isDay);
  updateWeatherEffects();
  updateHouseClouds();
  updateLightning();
  renderer.render(scene, camera);
}

function mainInit() {
  setupScene();
  onWindowResize();
  animate();
}

let currentYear, currentMonth;

function initCalendar() {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();
  populateYearSelect();
  renderCalendar(currentYear, currentMonth);
  const prevMonthBtn = document.getElementById("prev-month");
  const nextMonthBtn = document.getElementById("next-month");
  const yearSelect = document.getElementById("year-select");
  const deleteDayEventBtn = document.getElementById("delete-day-event");
  const saveCalendarBtn = document.getElementById("save-calendar");
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener("click", () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      renderCalendar(currentYear, currentMonth);
    });
  }
  if (nextMonthBtn) {
    nextMonthBtn.addEventListener("click", () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      renderCalendar(currentYear, currentMonth);
    });
  }
  if (yearSelect) {
    yearSelect.addEventListener("change", (e) => {
      currentYear = parseInt(e.target.value);
      renderCalendar(currentYear, currentMonth);
    });
  }
  if (deleteDayEventBtn) {
    deleteDayEventBtn.addEventListener("click", () => {
      const dayStr = prompt("삭제할 하루일정의 날짜(일)를 입력하세요 (예: 15):");
      if (dayStr) {
        const dayNum = parseInt(dayStr);
        const eventDiv = document.getElementById(`event-${currentYear}-${currentMonth+1}-${dayNum}`);
        if (eventDiv) {
          eventDiv.textContent = "";
          alert(`${currentYear}-${currentMonth+1}-${dayNum} 일정이 삭제되었습니다.`);
        }
      }
    });
  }
  if (saveCalendarBtn) {
    saveCalendarBtn.addEventListener("click", () => {
      saveCalendar();
    });
  }
}

function populateYearSelect() {
  const yearSelect = document.getElementById("year-select");
  if (!yearSelect) return;
  yearSelect.innerHTML = "";
  for (let y = 2020; y <= 2070; y++) {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    if (y === currentYear) option.selected = true;
    yearSelect.appendChild(option);
  }
}

function renderCalendar(year, month) {
  const monthNames = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  const monthYearLabel = document.getElementById("month-year-label");
  const grid = document.getElementById("calendar-grid");
  if (!monthYearLabel || !grid) return;
  monthYearLabel.textContent = `${year}년 ${monthNames[month]}`;
  grid.innerHTML = "";
  const daysOfWeek = ["일","월","화","수","목","금","토"];
  daysOfWeek.forEach(day => {
    const th = document.createElement("div");
    th.style.fontWeight = "bold";
    th.style.textAlign = "center";
    th.textContent = day;
    grid.appendChild(th);
  });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  for (let i = 0; i < firstDay; i++) {
    grid.appendChild(document.createElement("div"));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("div");
    cell.innerHTML = `<div class="day-number">${d}</div>
                      <div class="event" id="event-${year}-${month+1}-${d}"></div>`;
    cell.addEventListener("click", () => {
      const eventText = prompt(`${year}-${month+1}-${d} 일정 입력:`);
      if (eventText) {
        const eventDiv = document.getElementById(`event-${year}-${month+1}-${d}`);
        if (eventDiv) {
          if (eventDiv.textContent) {
            eventDiv.textContent += "; " + eventText;
          } else {
            eventDiv.textContent = eventText;
          }
        }
      }
    });
    grid.appendChild(cell);
  }
}

function saveCalendar() {
  const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();
  const calendarData = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const eventDiv = document.getElementById(`event-${currentYear}-${currentMonth+1}-${d}`);
    if (eventDiv && eventDiv.textContent.trim() !== "") {
      calendarData[`${currentYear}-${currentMonth+1}-${d}`] = eventDiv.textContent;
    }
  }
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(calendarData, null, 2));
  const dlAnchorElem = document.createElement("a");
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "calendar_events.json");
  dlAnchorElem.style.display = "none";
  document.body.appendChild(dlAnchorElem);
  dlAnchorElem.click();
  document.body.removeChild(dlAnchorElem);
}

function showTutorial() {
  const overlay = document.getElementById("tutorial-overlay");
  if (!overlay) return;
  overlay.style.display = "flex";
  setTimeout(() => { overlay.style.opacity = "1"; }, 10);
  setTimeout(() => {
    overlay.style.opacity = "0";
    setTimeout(() => { overlay.style.display = "none"; }, 1000);
  }, 4000);
}

function changeVersion(version) {
  if (version === "1.3") {
    window.location.href = window.location.href;
  } else if (version === "latest") {
    alert("최신 버전으로 이동하려면 해당 URL을 입력하세요.");
  }
}

document.addEventListener("DOMContentLoaded", function() {
  const regionSelect = document.getElementById("region-select");
  if (regionSelect) {
    regionList.forEach(region => {
      const option = document.createElement("option");
      option.value = region;
      option.textContent = `${region} (${regionMap[region]})`;
      if (region === currentCity) option.selected = true;
      regionSelect.appendChild(option);
    });
  }
  const hud2Toggle = document.getElementById("hud-2-toggle");
  if (hud2Toggle) {
    hud2Toggle.addEventListener("click", toggleHud2);
  }
});

window.addEventListener("load", async () => {
  mainInit();
  initCalendar();
  showTutorial();
  updateMap();
  await updateWeatherAndEffects();
  onWindowResize();
});
