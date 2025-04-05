
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>3D 캐릭터 HUD & 감정 학습</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; font-family: 'Courier New', monospace; overflow: hidden; }
    
    #right-hud {
      position: fixed;
      top: 10%;
      right: 1%;
      width: 20%;
      padding: 1%;
      background: rgba(255,255,255,0.8);
      border-radius: 5px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 20;
    }
    #region-select {
      width: 100%;
      padding: 5px;
      font-size: 14px;
      margin-bottom: 10px;
    }
    #chat-input-area {
      display: flex;
      margin-top: 10px;
    }
    #chat-input {
      flex: 1;
      padding: 5px;
      font-size: 14px;
    }
    #file-upload {
      margin-top: 10px;
      font-size: 14px;
    }
    
    #canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      display: block;
    }
    #speech-bubble {
      position: fixed;
      background: white;
      padding: 5px 10px;
      border-radius: 10px;
      font-size: 12px;
      display: none;
      z-index: 30;
      white-space: pre-line;
      pointer-events: none;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    
    @media (max-width: 480px) {
      #right-hud { width: 90%; left: 5%; right: 5%; top: 5%; }
    }
  </style>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
  
  <script>
    let currentCity = "서울";
    let currentWeather = "";
    let wordFrequencies = {};
    let emotionMap = {
      "안녕": "👋 안녕!",
      "반갑": "🤗 반갑습니다!",
      "뭐해": "🤔 나? 지금 너랑 대화 중이야!",
      "기쁘": "🎉 나도 기뻐!",
      "좋아": "😊 좋아, 나도 좋아!",
      "슬프": "😢 슬프구나... 괜찮아?",
      "화나": "😡 화났어? 진정해...",
      "사랑": "💕 나도 사랑해!"
    };

    const regionMap = {
      "서울": "Seoul",
      "인천": "Incheon",
      "수원": "Suwon",
      "고양": "Goyang",
      "성남": "Seongnam",
      "용인": "Yongin",
      "부천": "Bucheon",
      "안양": "Anyang",
      "의정부": "Uijeongbu",
      "광명": "Gwangmyeong",
      "안산": "Ansan",
      "파주": "Paju",
      "부산": "Busan",
      "대구": "Daegu",
      "광주": "Gwangju",
      "대전": "Daejeon",
      "울산": "Ulsan",
      "제주": "Jeju",
      "전주": "Jeonju",
      "청주": "Cheongju",
      "포항": "Pohang",
      "여수": "Yeosu",
      "김해": "Gimhae"
    };
    const regionList = Object.keys(regionMap);

    // 데이터 전처리: 토큰화 및 정제
    function tokenizeAndClean(text) {
      text = text.toLowerCase()
                 .replace(/[^\w\s가-힣]/g, '')
                 .replace(/\s+/g, ' ')
                 .trim();
      const tokens = text.split(' ');
      return tokens.filter(token => token.length > 0);
    }

    // 학습 파이프라인
    function trainModel(data, batchSize = 10, initialLearningRate = 0.01, epochs = 3) {
      let learningRate = initialLearningRate;
      let tokens = [];
      if (typeof data === 'string') {
        tokens = tokenizeAndClean(data);
      } else if (typeof data === 'object') {
        for (let date in data) {
          const eventText = data[date];
          tokens = tokens.concat(tokenizeAndClean(eventText));
        }
      }

      if (tokens.length === 0) {
        return "학습할 데이터가 없습니다.";
      }

      for (let epoch = 0; epoch < epochs; epoch++) {
        learningRate = initialLearningRate * (1 - epoch / epochs);
        for (let i = 0; i < tokens.length; i += batchSize) {
          const batch = tokens.slice(i, i + batchSize);
          batch.forEach(token => {
            wordFrequencies[token] = (wordFrequencies[token] || 0) + learningRate;
          });
        }
      }

      const newKeywords = Object.keys(wordFrequencies)
        .filter(word => wordFrequencies[word] > 0.02 && !emotionMap[word])
        .sort((a, b) => wordFrequencies[b] - wordFrequencies[a])
        .slice(0, 3);

      let result = "학습 완료! 새로 학습된 단어:\n";
      newKeywords.forEach(word => {
        result += `${word}: 빈도 ${wordFrequencies[word].toFixed(2)}\n`;
        if (!emotionMap[word]) {
          emotionMap[word] = `😀 ${word}이(가) 자주 나왔네요!`;
        }
      });

      if (newKeywords.length === 0) {
        result += "새로운 감정 키워드가 없습니다.\n";
      }

      return result;
    }

    // 감정 인식 및 반응
    function respondToEmotion(input) {
      const tokens = tokenizeAndClean(input);
      for (let token of tokens) {
        for (let keyword in emotionMap) {
          if (token.includes(keyword)) {
            return emotionMap[keyword];
          }
        }
      }
      return "🤔 잘 이해하지 못했어요. 다시 말해줄래요?";
    }

    async function sendChat() {
      const inputEl = document.getElementById("chat-input");
      const input = inputEl.value.trim();
      if (!input) return;

      let response = "";
      const lowerInput = input.toLowerCase();

      if (lowerInput.startsWith("지역 ")) {
        const newCity = lowerInput.replace("지역", "").trim();
        if (regionList.includes(newCity)) {
          currentCity = newCity;
          document.getElementById("region-select").value = newCity;
          response = `지역이 ${newCity}(으)로 변경되었습니다.`;
          updateMap();
          await updateWeatherAndEffects();
        } else {
          response = "지원하지 않는 지역입니다. 드롭다운 메뉴에서 선택해주세요.";
        }
      } else if (regionList.includes(input)) {
        currentCity = input;
        document.getElementById("region-select").value = input;
        response = `지역이 ${input}(으)로 변경되었습니다.`;
        updateMap();
        await updateWeatherAndEffects();
      } else if (lowerInput.includes("날씨")) {
        await updateWeatherAndEffects();
        return;
      } else if (lowerInput.includes("시간") || lowerInput.includes("몇시")) {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        response = `현재 시간은 ${hours}시 ${minutes}분입니다.`;
      } else if (lowerInput.includes("안녕")) {
        response = "안녕하세요, 주인님! 오늘 기분은 어떠세요?";
        characterGroup.children[7].rotation.z = Math.PI / 4;
        setTimeout(() => { characterGroup.children[7].rotation.z = 0; }, 1000);
      } else if (lowerInput.includes("기분")) {
        response = trainModel(input) + "\n기분은 어때요?";
      } else {
        response = trainModel(input) + "\n" + respondToEmotion(input);
      }

      showSpeechBubbleInChunks(response);
      inputEl.value = "";
    }

    // 파일 업로드 처리
    function handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        const content = e.target.result;
        let data;
        try {
          if (file.name.endsWith('.json')) {
            data = JSON.parse(content);
          } else {
            data = content;
          }
          const result = trainModel(data);
          showSpeechBubbleInChunks(result);
        } catch (err) {
          showSpeechBubbleInChunks("파일을 처리하는 중 오류가 발생했습니다: " + err.message);
        }
      };
      reader.readAsText(file);
    }

    function updateMap() {
      // Map update logic (not shown in this simplified version)
    }

    async function updateWeatherAndEffects(sendMessage = true) {
      // Weather update logic (not shown in this simplified version)
      showSpeechBubbleInChunks("날씨 정보를 업데이트했습니다.");
    }

    function showSpeechBubbleInChunks(text, chunkSize = 15, delay = 3000) {
      const bubble = document.getElementById("speech-bubble");
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

    window.addEventListener("DOMContentLoaded", function() {
      document.getElementById("chat-input").addEventListener("keydown", function(e) {
        if (e.key === "Enter") sendChat();
      });

      const regionSelect = document.getElementById("region-select");
      regionList.forEach(region => {
        const option = document.createElement("option");
        option.value = region;
        option.textContent = `${region} (${regionMap[region]})`;
        if (region === currentCity) option.selected = true;
        regionSelect.appendChild(option);
      });

      document.getElementById("file-upload").addEventListener("change", handleFileUpload);
    });

    window.addEventListener("resize", function(){
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener("load", async () => {
      updateMap();
      await updateWeatherAndEffects();
    });
  </script>
</head>
<body>
  <div id="right-hud">
    <h3>채팅창</h3>
    <select id="region-select" onchange="changeRegion(this.value)">
      <option value="" disabled>지역 선택</option>
    </select>
    <div id="chat-input-area">
      <input type="text" id="chat-input" placeholder="채팅 입력..." />
    </div>
    <input type="file" id="file-upload" accept=".txt,.json" />
  </div>
  
  <div id="speech-bubble"></div>
  
  <canvas id="canvas"></canvas>
  
  <script>
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas"), alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.set(5, 5, 10);
    camera.lookAt(0, 0, 0);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7).normalize();
    scene.add(directionalLight);
    scene.add(new THREE.AmbientLight(0x333333));

    const sunMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xff9900, transparent: true, opacity: 1 });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(1.5, 64, 64), sunMaterial);
    scene.add(sun);

    const floorGeometry = new THREE.PlaneGeometry(400, 400, 128, 128);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 1, metalness: 0 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI/2;
    floor.position.y = -2;
    scene.add(floor);

    const characterGroup = new THREE.Group();
    const charBody = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.5),
                                    new THREE.MeshStandardMaterial({ color: 0x00cc66 }));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32),
                                new THREE.MeshStandardMaterial({ color: 0xffcc66 }));
    head.position.y = 1.2;
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), eyeMat);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), eyeMat);
    leftEye.position.set(-0.2, 1.3, 0.45);
    rightEye.position.set(0.2, 1.3, 0.45);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05),
                                 new THREE.MeshStandardMaterial({ color: 0xff3366 }));
    mouth.position.set(0, 1.1, 0.51);
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), charBody.material);
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), charBody.material);
    leftArm.position.set(-0.7, 0.4, 0);
    rightArm.position.set(0.7, 0.4, 0);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x3366cc });
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), legMat);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), legMat);
    leftLeg.position.set(-0.35, -1, 0);
    rightLeg.position.set(0.35, -1, 0);
    characterGroup.add(charBody, head, leftEye, rightEye, mouth, leftArm, rightArm, leftLeg, rightLeg);
    characterGroup.position.y = -1;
    scene.add(characterGroup);

    function createStreetlight() {
      const lightGroup = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 8),
                                    new THREE.MeshBasicMaterial({ color: 0x333333 }));
      pole.position.y = 2;
      lightGroup.add(pole);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8),
                                    new THREE.MeshBasicMaterial({ color: 0xffcc00 }));
      lamp.position.y = 4.2;
      lightGroup.add(lamp);
      return lightGroup;
    }
    const characterStreetlight = createStreetlight();
    characterStreetlight.position.set(1, -2, 0);
    scene.add(characterStreetlight);

    function animate() {
      requestAnimationFrame(animate);
      const now = new Date();
      const headWorldPos = new THREE.Vector3();
      head.getWorldPosition(headWorldPos);
      const totalMin = now.getHours() * 60 + now.getMinutes();
      const angle = (totalMin / 1440) * Math.PI * 2;
      const radius = 3;
      const sunPos = new THREE.Vector3(
        headWorldPos.x + Math.cos(angle) * radius,
        headWorldPos.y + Math.sin(angle) * radius,
        headWorldPos.z
      );
      sun.position.copy(sunPos);
      characterStreetlight.position.set(characterGroup.position.x + 1, -2, characterGroup.position.z);
      updateBubblePosition();
      renderer.render(scene, camera);
    }
    animate();

    function updateBubblePosition() {
      const bubble = document.getElementById("speech-bubble");
      const headWorldPos = new THREE.Vector3();
      head.getWorldPosition(headWorldPos);
      const screenPos = headWorldPos.project(camera);
      bubble.style.left = ((screenPos.x * 0.5 + 0.5) * window.innerWidth) + "px";
      bubble.style.top = ((1 - (screenPos.y * 0.5 + 0.5)) * window.innerHeight - 50) + "px";
    }
  </script>
</body>
</html>
