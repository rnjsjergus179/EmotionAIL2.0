
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>3D 캐릭터 HUD, 캘린더, 음성 채팅 & 말풍선 with GPT-3.5</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; font-family: 'Courier New', monospace; overflow: hidden; }
    #right-hud { position: fixed; top: 10%; right: 1%; width: 20%; padding: 1%; background: rgba(255,255,255,0.8); border-radius: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); z-index: 20; }
    #region-select { width: 100%; padding: 5px; font-size: 14px; margin-bottom: 10px; }
    #chat-log { display: none; height: 100px; overflow-y: scroll; border: 1px solid #ccc; padding: 5px; margin-top: 10px; border-radius: 3px; background: #fff; }
    #chat-input-area { display: flex; margin-top: 10px; }
    #chat-input { flex: 1; padding: 5px; font-size: 14px; }
    #hud-6 { position: fixed; top: 45%; right: 1%; width: 20%; padding: 5px; background: rgba(255,255,255,0.95); border-radius: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); z-index: 25; text-align: center; }
    #hud-6 button { padding: 8px 12px; font-size: 14px; border: none; border-radius: 4px; background: #00ffcc; color: #000; cursor: pointer; transition: background 0.3s; }
    #hud-6 button:hover { background: #00cc99; }
    #left-hud { position: fixed; top: 10%; left: 1%; width: 20%; padding: 1%; background: rgba(0, 0, 0, 0.7); border: 2px solid #00ffcc; border-radius: 10px; box-shadow: 0 0 15px rgba(0,255,204,0.5); z-index: 20; max-height: 80vh; overflow-y: auto; color: #00ffcc; }
    #left-hud h3 { margin-bottom: 5px; text-shadow: 0 0 5px #00ffcc; }
    #calendar-container { margin-top: 10px; }
    #calendar-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
    #calendar-header button { padding: 2px 6px; font-size: 12px; cursor: pointer; background: #00ffcc; color: #000; border: none; border-radius: 3px; box-shadow: 0 0 5px #00ffcc; transition: all 0.3s; }
    #calendar-header button:hover { background: #00cc99; box-shadow: 0 0 10px #00ffcc; }
    #month-year-label { font-weight: bold; font-size: 14px; text-shadow: 0 0 5px #00ffcc; }
    #year-select { font-size: 12px; padding: 2px; margin-left: 5px; background: #333; color: #00ffcc; border: 1px solid #00ffcc; border-radius: 3px; }
    #calendar-actions { margin-top: 5px; text-align: center; }
    #calendar-actions button { margin: 2px; padding: 5px 8px; font-size: 12px; cursor: pointer; background: #00ffcc; color: #000; border: none; border-radius: 3px; box-shadow: 0 0 5px #00ffcc; transition: all 0.3s; }
    #calendar-actions button:hover { background: #00cc99; box-shadow: 0 0 10px #00ffcc; }
    #calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
    #calendar-grid div { background: rgba(255,255,255,0.1); border: 1px solid #00ffcc; border-radius: 4px; min-height: 25px; font-size: 10px; padding: 2px; position: relative; cursor: pointer; transition: all 0.3s; }
    #calendar-grid div:hover { background: rgba(0,255,204,0.3); box-shadow: 0 0 5px #00ffcc; }
    .day-number { position: absolute; top: 2px; left: 2px; font-weight: bold; font-size: 10px; color: #00ffcc; text-shadow: 0 0 3px #00ffcc; }
    .event { margin-top: 14px; font-size: 8px; color: #00ffcc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-shadow: 0 0 3px #00ffcc; }
    #hud-7 { position: fixed; bottom: 0; left: 0; width: 100%; height: 30px; background: rgba(0, 0, 0, 0.8); color: #00ffcc; text-align: center; line-height: 30px; font-size: 14px; z-index: 50; box-shadow: 0 -2px 5px rgba(0,255,204,0.3); }
    #canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; display: block; }
    #speech-bubble { position: fixed; background: white; padding: 5px 10px; border-radius: 10px; font-size: 12px; display: none; z-index: 30; white-space: pre-line; pointer-events: none; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
    #hud-3 { position: fixed; top: 70%; right: 1%; width: 20%; height: 20%; padding: 1%; background: rgba(255,255,255,0.9); border-radius: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); z-index: 20; overflow: hidden; }
    @media (max-width: 480px) { #right-hud, #left-hud, #hud-3, #hud-6 { width: 90%; left: 5%; right: 5%; top: 5%; } }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
</head>
<body>
  <div id="right-hud">
    <h3>채팅창</h3>
    <select id="region-select" onchange="changeRegion(this.value)">
      <option value="" disabled>지역 선택</option>
    </select>
    <div id="chat-log"></div>
    <div id="chat-input-area">
      <input type="text" id="chat-input" placeholder="채팅 입력..." />
    </div>
  </div>
  <div id="hud-6">
    <button onclick="startSpeechRecognition()">🎤 음성 입력</button>
  </div>
  <div id="hud-3">
    <iframe id="map-iframe" src="https://www.google.com/maps?q=Seoul&output=embed" frameborder="0" style="width:100%; height:100%; border:0;" allowfullscreen></iframe>
  </div>
  <div id="left-hud">
    <h3>캘린더</h3>
    <div id="calendar-container">
      <div id="calendar-header">
        <button id="prev-month">◀</button>
        <span id="month-year-label"></span>
        <button id="next-month">▶</button>
        <select id="year-select"></select>
      </div>
      <div id="calendar-actions">
        <button id="delete-day-event">하루일정 삭제</button>
        <button id="save-calendar">바탕화면 저장</button>
      </div>
      <div id="calendar-grid"></div>
    </div>
  </div>
  <div id="speech-bubble"></div>
  <div id="hud-7">버전 2.0 베타 with GPT-3.5</div>
  <canvas id="canvas"></canvas>

  <script>
    // 키워드 정의
    const KEYWORDS = {
      greetings: ["안녕", "안녕하세요", "안녕 하세", "안녕하시오", "안녕한갑네"],
      sleep: ["잘자", "좋은꿈", "좋은 꿈", "잘자요", "잘자시게", "잘자리요", "잘자라니께"],
      youtube: ["유튜브", "유트브", "유튜브알려줘", "유튭", "유튜브랑", "유튜브나와줘"],
      twitter: ["트위터", "트위터 보여주게", "트위터 틔위터검색", "트위터보여", "트위터보여줘봐"],
      naver: ["네이버", "네이버 보여줘", "네이버 보여주게", "네이버 검색"],
      weather: ["날씨알려줘", "날씨알려주게", "날씨좀알려줘", "날씨 알려줘", "날씨 좀 알려줘", "날씨 어때", "날씨 맑아"],
      calendar: ["일정 알려줘"],
      time: ["시간 알려줘"],
      map: ["지도 보여줘", "교통정보"],
      delete: ["하루일정 삭제", "하루일과 삭제해줘", "하루일과", "하루일저", "하루 일관"],
      instagram: ["인스타", "인스타 보여줘", "인스타 나오게", "인스타 검색", "인스타그램"]
    };

    // 전역 변수
    let blockUntil = 0;
    let currentCity = "서울";
    let currentWeather = "";
    const weatherKey = "2caa7fa4a66f2f8d150f1da93d306261";
    const regionMap = {
      "서울": "Seoul", "인천": "Incheon", "수원": "Suwon", "고양": "Goyang", "성남": "Seongnam",
      "용인": "Yongin", "부천": "Bucheon", "안양": "Anyang", "의정부": "Uijeongbu", "광명": "Gwangmyeong",
      "안산": "Ansan", "파주": "Paju", "부산": "Busan", "대구": "Daegu", "광주": "Gwangju",
      "대전": "Daejeon", "울산": "Ulsan", "제주": "Jeju", "전주": "Jeonju", "청주": "Cheongju",
      "포항": "Pohang", "여수": "Yeosu", "김해": "Gimhae"
    };
    const regionList = Object.keys(regionMap);

    // Three.js 변수
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas"), alpha: true });
    let rainGroup, cloudRainGroup, houseCloudGroup, lightningLight, head;

    // 이벤트 리스너
    document.addEventListener("contextmenu", event => event.preventDefault());
    document.addEventListener("copy", function(e) {
      e.preventDefault();
      let selectedText = window.getSelection().toString();
      selectedText = selectedText.replace(/2caa7fa4a66f2f8d150f1da93d306261/g, "HIDDEN");
      e.clipboardData.setData("text/plain", selectedText);
      if (Date.now() < blockUntil) return;
      blockUntil = Date.now() + 3600000;
      showSpeechBubbleInChunks("1시간동안 차단됩니다.");
    });
    window.addEventListener("resize", function(){
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 함수 정의
    function speakText(text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      utterance.volume = 1;
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
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
      dlAnchorElem.click();
      document.body.removeChild(dlAnchorElem);
    }

    function deleteCalendarEvent(day) {
      const eventDiv = document.getElementById(`event-${currentYear}-${currentMonth+1}-${day}`);
      if (eventDiv) {
        eventDiv.textContent = "";
        const calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
        delete calendarData[`${currentYear}-${currentMonth+1}-${day}`];
        localStorage.setItem("calendarEvents", JSON.stringify(calendarData));
        return `${currentYear}-${currentMonth+1}-${day} 일정이 삭제되었습니다.`;
      }
      return "해당 날짜에 일정이 없습니다.";
    }

    function getCalendarEvents(dateStr = null) {
      const calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
      if (!Object.keys(calendarData).length) return "저장된 일정이 없습니다.";
      if (dateStr) return calendarData[dateStr] ? `${dateStr}의 일정: ${calendarData[dateStr]}` : `${dateStr}에는 일정이 없습니다.`;
      const currentMonthStr = `${currentYear}-${currentMonth+1}`;
      let events = Object.keys(calendarData)
        .filter(key => key.startsWith(currentMonthStr))
        .map(key => `${key}: ${calendarData[key]}`);
      return events.length ? `현재 월(${currentMonthStr})의 일정:\n${events.join("\n")}` : `현재 월(${currentMonthStr})에는 일정이 없습니다.`;
    }

    function updateMap() {
      const englishCity = regionMap[currentCity] || "Seoul";
      document.getElementById("map-iframe").src = `https://www.google.com/maps?q=${encodeURIComponent(englishCity)}&output=embed`;
    }

    async function getWeather() {
      try {
        const englishCity = regionMap[currentCity] || "Seoul";
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${englishCity}&appid=${weatherKey}&units=metric&lang=kr`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("날씨 API 호출 실패");
        const data = await res.json();
        currentWeather = data.weather[0].description;
        return `오늘 ${currentCity}의 날씨는 ${data.weather[0].description}이고, 기온은 ${data.main.temp}°C입니다.`;
      } catch (error) {
        console.error(error);
        currentWeather = "";
        return "날씨 정보를 가져오는데 실패했습니다.";
      }
    }

    function updateWeatherEffects() {
      if (!currentWeather) return;
      rainGroup.visible = currentWeather.includes("비") || currentWeather.includes("소나기");
      cloudRainGroup.visible = rainGroup.visible;
      houseCloudGroup.visible = currentWeather.includes("구름") || currentWeather.includes("흐림");
    }

    function updateLightning() {
      if (currentWeather.includes("번개") || currentWeather.includes("뇌우")) {
        if (Math.random() < 0.001) {
          lightningLight.intensity = 5;
          setTimeout(() => lightningLight.intensity = 0, 100);
        }
      }
    }

    async function updateWeatherAndEffects(sendMessage = true) {
      const message = await getWeather();
      if (sendMessage) showSpeechBubbleInChunks(message);
      updateWeatherEffects();
    }

    function changeRegion(value) {
      currentCity = value;
      updateMap();
      updateWeatherAndEffects();
      const englishCity = regionMap[currentCity] || "Seoul";
      showSpeechBubbleInChunks(`지역이 ${currentCity} (${englishCity})로 변경되었습니다.`);
    }

    function startSpeechRecognition() {
      if (!('webkitSpeechRecognition' in window)) {
        alert("이 브라우저는 음성 인식을 지원하지 않습니다.");
        return;
      }
      const recognition = new webkitSpeechRecognition();
      recognition.lang = "ko-KR";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.start();
      recognition.onresult = event => {
        const transcript = event.results[0][0].transcript.trim();
        document.getElementById("chat-input").value = transcript;
        sendChat();
      };
      recognition.onerror = event => console.error("음성 인식 오류:", event.error);
    }

    async function callGPTProxy(prompt) {
      console.log("GPT 호출:", prompt);
      try {
        const res = await fetch("http://localhost:3000/api/gpt", { // 서버 URL 명시
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 150,
            temperature: 0.7
          })
        });
        const data = await res.json();
        console.log("GPT 응답:", data);
        if (!res.ok) throw new Error(data.error || "GPT 호출 실패");
        return data.choices[0].message.content.trim();
      } catch (error) {
        console.error("GPT 오류:", error);
        return "죄송해요, 응답을 생성하는 데 문제가 생겼습니다.";
      }
    }

    async function sendChat() {
      const inputEl = document.getElementById("chat-input");
      const input = inputEl.value.trim();
      if (Date.now() < blockUntil) {
        showSpeechBubbleInChunks("1시간동안 차단됩니다.");
        inputEl.value = "";
        return;
      }
      if (!input) return;
      let response = "";
      const lowerInput = input.toLowerCase();

      if (lowerInput.includes("파일 저장해줘") || lowerInput.includes("캘린더 저장해줘")) {
        saveCalendar();
        speakText("캘린더를 저장했습니다.");
        inputEl.value = "";
        return;
      }

      if (lowerInput.startsWith("지역 ")) {
        const newCity = lowerInput.replace("지역", "").trim();
        if (regionList.includes(newCity)) {
          currentCity = newCity;
          document.getElementById("region-select").value = newCity;
          response = `좋아요, 지역을 ${newCity}(으)로 변경할게요!`;
          updateMap();
          await updateWeatherAndEffects();
        } else {
          response = "죄송해요, 그 지역은 지원하지 않아요.";
        }
      } else if (regionList.includes(input)) {
        currentCity = input;
        document.getElementById("region-select").value = input;
        response = `좋아요, 지역을 ${input}(으)로 변경할게요!`;
        updateMap();
        await updateWeatherAndEffects();
      } else if (KEYWORDS.delete.some(keyword => lowerInput.includes(keyword))) {
        const dayStr = prompt("삭제할 날짜(일)를 입력하세요 (예: 15):");
        if (dayStr) response = deleteCalendarEvent(parseInt(dayStr));
      } else if (KEYWORDS.greetings.some(keyword => lowerInput.includes(keyword))) {
        response = "안녕하세요! 만나서 반갑습니다.";
      } else if (KEYWORDS.sleep.some(keyword => lowerInput.includes(keyword))) {
        response = "편안한 밤 되세요, 좋은 꿈 꾸세요~";
      } else if (KEYWORDS.youtube.some(keyword => lowerInput.includes(keyword))) {
        response = "유튜브를 보여드릴게요!";
        showSpeechBubbleInChunks(response);
        setTimeout(() => window.location.href = "https://www.youtube.com/", 2000);
        inputEl.value = "";
        return;
      } else if (KEYWORDS.twitter.some(keyword => lowerInput.includes(keyword))) {
        response = "트위터(X)를 보여드릴게요!";
        showSpeechBubbleInChunks(response);
        setTimeout(() => window.location.href = "https://x.com/login?lang=ko", 2000);
        inputEl.value = "";
        return;
      } else if (KEYWORDS.naver.some(keyword => lowerInput.includes(keyword))) {
        response = "네이버를 보여드릴게요!";
        showSpeechBubbleInChunks(response);
        setTimeout(() => window.location.href = "https://m.naver.com/", 2000);
        inputEl.value = "";
        return;
      } else if (KEYWORDS.weather.some(keyword => lowerInput.includes(keyword))) {
        await updateWeatherAndEffects();
        inputEl.value = "";
        return;
      } else if (lowerInput.includes("일정") && lowerInput.includes("알려줘")) {
        const dateMatch = input.match(/\d{4}-\d{1,2}-\d{1,2}/);
        response = dateMatch ? getCalendarEvents(dateMatch[0]) : getCalendarEvents();
      } else if (KEYWORDS.time.some(keyword => lowerInput.includes(keyword))) {
        const now = new Date();
        response = `현재 시간은 ${now.getHours()}시 ${now.getMinutes()}분입니다.`;
      } else if (KEYWORDS.map.some(keyword => lowerInput.includes(keyword))) {
        response = "지도를 보여드릴게요!";
        showSpeechBubbleInChunks(response);
        setTimeout(() => window.location.href = "https://www.google.com/maps", 2000);
        inputEl.value = "";
        return;
      } else if (KEYWORDS.instagram.some(keyword => lowerInput.includes(keyword))) {
        response = "인스타그램을 보여드릴게요!";
        showSpeechBubbleInChunks(response);
        setTimeout(() => window.location.href = "https://www.instagram.com/", 2000);
        inputEl.value = "";
        return;
      } else {
        response = await callGPTProxy(input);
      }

      showSpeechBubbleInChunks(response);
      inputEl.value = "";
    }

    function showSpeechBubbleInChunks(text, chunkSize = 15, delay = 3000) {
      const bubble = document.getElementById("speech-bubble");
      const chunks = [];
      for (let i = 0; i < text.length; i += chunkSize) chunks.push(text.slice(i, i + chunkSize));
      let index = 0;
      function showNextChunk() {
        if (index < chunks.length) {
          bubble.textContent = chunks[index];
          bubble.style.display = "block";
          updateBubblePosition();
          speakText(chunks[index]);
          index++;
          setTimeout(showNextChunk, delay);
        } else {
          setTimeout(() => bubble.style.display = "none", 3000);
        }
      }
      showNextChunk();
    }

    // Three.js 초기화
    function initThreeJS() {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.position.set(5, 5, 10);
      camera.lookAt(0, 0, 0);

      scene.add(new THREE.DirectionalLight(0xffffff, 1).position.set(5, 10, 7).normalize());
      scene.add(new THREE.AmbientLight(0x333333));

      const sun = new THREE.Mesh(new THREE.SphereGeometry(1.5, 64, 64), new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xff9900, transparent: true, opacity: 0 }));
      scene.add(sun);
      const moon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 64), new THREE.MeshStandardMaterial({ color: 0xcccccc, emissive: 0x222222, transparent: true, opacity: 1 }));
      scene.add(moon);

      const stars = [], fireflies = [];
      for (let i = 0; i < 200; i++) {
        const star = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        star.position.set((Math.random()-0.5)*100, (Math.random()-0.5)*60, -20);
        scene.add(star);
        stars.push(star);
      }
      for (let i = 0; i < 60; i++) {
        const firefly = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffff99 }));
        firefly.position.set((Math.random()-0.5)*40, (Math.random()-0.5)*20, -10);
        scene.add(firefly);
        fireflies.push(firefly);
      }

      const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 128, 128), new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 1, metalness: 0 }));
      floor.rotation.x = -Math.PI/2;
      floor.position.y = -2;
      scene.add(floor);

      const backgroundGroup = new THREE.Group();
      scene.add(backgroundGroup);
      function createBuilding(width, height, depth, color) {
        const buildingGroup = new THREE.Group();
        const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1 }));
        buildingGroup.add(building);
        const windowMat = new THREE.MeshStandardMaterial({ color: 0x87CEEB });
        for (let y = 3; y < height - 1; y += 2) {
          for (let x = -width/2 + 0.5; x < width/2; x += 1) {
            const window = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.1), windowMat);
            window.position.set(x, y - height/2, depth/2 + 0.01);
            buildingGroup.add(window);
          }
        }
        const door = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
        door.position.set(0, -height/2 + 1, depth/2 + 0.01);
        buildingGroup.add(door);
        return buildingGroup;
      }
      function createHouse(width, height, depth, baseColor, roofColor) {
        const houseGroup = new THREE.Group();
        const base = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.8 }));
        base.position.y = -2 + height/2;
        houseGroup.add(base);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(width * 0.8, height * 0.6, 4), new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.8 }));
        roof.position.y = -2 + height + (height * 0.6)/2;
        roof.rotation.y = Math.PI/4;
        houseGroup.add(roof);
        const windowMat = new THREE.MeshStandardMaterial({ color: 0xFFFFE0 });
        houseGroup.add(
          new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), windowMat).position.set(-width/4, -2 + height/2, depth/2 + 0.01),
          new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), windowMat).position.set(width/4, -2 + height/2, depth/2 + 0.01)
        );
        const door = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.1), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
        door.position.set(0, -2 + height/4, depth/2 + 0.01);
        houseGroup.add(door);
        return houseGroup;
      }
      for (let i = 0; i < 20; i++) {
        const building = createBuilding(Math.random() * 4 + 4, Math.random() * 20 + 20, Math.random() * 4 + 4, 0x555555);
        building.position.set(-50 + (i % 10) * 10, -2 + building.children[0].geometry.parameters.height/2, -30 - Math.floor(i / 10) * 20);
        backgroundGroup.add(building);
      }
      for (let i = 0; i < 10; i++) {
        const house = createHouse(Math.random() * 4 + 6, Math.random() * 4 + 6, Math.random() * 4 + 6, 0xa0522d, 0x8b0000);
        house.position.set(-40 + i * 10, 0, -10);
        backgroundGroup.add(house);
      }

      const characterStreetlight = new THREE.Group();
      characterStreetlight.add(
        new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 8), new THREE.MeshBasicMaterial({ color: 0x333333 })).position.set(0, 2, 0),
        new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffcc00 })).position.set(0, 4.2, 0),
        new THREE.PointLight(0xffcc00, 1, 10).position.set(0, 4.2, 0)
      );
      characterStreetlight.position.set(1, -2, 0);
      scene.add(characterStreetlight);

      rainGroup = new THREE.Group();
      const rainGeometry = new THREE.BufferGeometry();
      const rainPositions = new Float32Array(2000 * 3);
      for (let i = 0; i < 2000; i++) {
        rainPositions[i * 3] = Math.random() * 200 - 100;
        rainPositions[i * 3 + 1] = Math.random() * 100;
        rainPositions[i * 3 + 2] = Math.random() * 200 - 100;
      }
      rainGeometry.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
      rainGroup.add(new THREE.Points(rainGeometry, new THREE.PointsMaterial({ color: 0xaaaaee, size: 0.1, transparent: true, opacity: 0.6 })));
      rainGroup.visible = false;
      scene.add(rainGroup);

      houseCloudGroup = new THREE.Group();
      const cloud = new THREE.Group();
      const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
      cloud.add(
        new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), cloudMat).position.set(0, 0, 0),
        new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), cloudMat).position.set(0.6, 0.2, 0),
        new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), cloudMat).position.set(-0.6, 0.1, 0)
      );
      cloud.scale.set(2, 2, 2);
      houseCloudGroup.add(cloud);
      houseCloudGroup.position.set(0, 2, 0);
      scene.add(houseCloudGroup);

      cloudRainGroup = new THREE.Group();
      const cloudRainGeometry = new THREE.BufferGeometry();
      const cloudRainPositions = new Float32Array(100 * 3);
      for (let i = 0; i < 100; i++) {
        cloudRainPositions[i * 3] = (Math.random()-0.5) * 1.5;
        cloudRainPositions[i * 3 + 1] = Math.random() * 0.2;
        cloudRainPositions[i * 3 + 2] = (Math.random()-0.5) * 1.5;
      }
      cloudRainGeometry.setAttribute("position", new THREE.BufferAttribute(cloudRainPositions, 3));
      cloudRainGroup.add(new THREE.Points(cloudRainGeometry, new THREE.PointsMaterial({ color: 0xaaaaee, size: 0.05, transparent: true, opacity: 0.8 })));
      cloudRainGroup.visible = false;
      houseCloudGroup.add(cloudRainGroup);

      lightningLight = new THREE.PointLight(0xffffff, 0, 500);
      lightningLight.position.set(0, 50, 0);
      scene.add(lightningLight);

      const characterGroup = new THREE.Group();
      const charBody = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x00cc66 }));
      head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffcc66 }));
      head.position.y = 1.2;
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      characterGroup.add(
        charBody,
        head,
        new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), eyeMat).position.set(-0.2, 1.3, 0.45),
        new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), eyeMat).position.set(0.2, 1.3, 0.45),
        new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05), new THREE.MeshStandardMaterial({ color: 0xff3366 })).position.set(0, 1.1, 0.51),
        new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.05), eyeMat).position.set(-0.2, 1.45, 0.45),
        new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.05), eyeMat).position.set(0.2, 1.45, 0.45),
        new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), charBody.material).position.set(-0.7, 0.4, 0),
        new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), charBody.material).position.set(0.7, 0.4, 0),
        new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), new THREE.MeshStandardMaterial({ color: 0x3366cc })).position.set(-0.35, -1, 0),
        new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), new THREE.MeshStandardMaterial({ color: 0x3366cc })).position.set(0.35, -1, 0)
      );
      characterGroup.position.y = -1;
      scene.add(characterGroup);

      const characterLight = new THREE.PointLight(0xffee88, 1, 15);
      scene.add(characterLight);

      for (let i = 0; i < 10; i++) {
        const tree = new THREE.Group();
        tree.add(
          new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2, 16), new THREE.MeshStandardMaterial({ color: 0x8B4513 })).position.set(0, -1, 0),
          new THREE.Mesh(new THREE.ConeGeometry(1, 3, 16), new THREE.MeshStandardMaterial({ color: 0x228B22 })).position.set(0, 0.5, 0)
        );
        tree.position.set(-50 + i * 10, -2, -15);
        scene.add(tree);
      }

      function animate() {
        requestAnimationFrame(animate);
        const now = new Date();
        const headWorldPos = new THREE.Vector3();
        head.getWorldPosition(headWorldPos);
        const totalMin = now.getHours() * 60 + now.getMinutes();
        const angle = (totalMin / 1440) * Math.PI * 2;
        sun.position.set(headWorldPos.x + Math.cos(angle) * 3, headWorldPos.y + Math.sin(angle) * 3, headWorldPos.z);
        moon.position.set(headWorldPos.x + Math.cos(angle + Math.PI) * 3, headWorldPos.y + Math.sin(angle + Math.PI) * 3, headWorldPos.z);
        const t = now.getHours() + now.getMinutes() / 60;
        sun.material.opacity = t < 6 ? 0 : t < 7 ? (t - 6) : t < 17 ? 1 : t < 18 ? (1 - (t - 17)) : 0;
        moon.material.opacity = 1 - sun.material.opacity;
        const isDay = (t >= 7 && t < 17);
        scene.background = new THREE.Color(isDay ? 0x87CEEB : 0x000033);
        stars.forEach(s => s.visible = !isDay);
        fireflies.forEach(f => f.visible = !isDay);
        characterStreetlight.traverse(child => { if (child instanceof THREE.PointLight) child.intensity = isDay ? 0 : 1; });
        characterLight.position.copy(characterGroup.position).add(new THREE.Vector3(0, 5, 0));
        characterLight.intensity = isDay ? 0 : 1;
        updateWeatherEffects();
        houseCloudGroup.position.set(headWorldPos.x + Math.sin(Date.now() * 0.001) * 1, headWorldPos.y + 2.5, headWorldPos.z);
        updateLightning();
        characterStreetlight.position.set(characterGroup.position.x + 1, -2, characterGroup.position.z);
        if (cloudRainGroup.visible) {
          const particles = cloudRainGroup.children[0];
          const positions = particles.geometry.attributes.position.array;
          for (let i = 0; i < positions.length; i += 3) {
            positions[i+1] -= 0.02;
            if (positions[i+1] < -0.3) positions[i+1] = Math.random() * 0.2;
          }
          particles.geometry.attributes.position.needsUpdate = true;
        }
        renderer.render(scene, camera);
      }
      animate();
    }

    // 캘린더 초기화
    let currentYear, currentMonth;
    function initCalendar() {
      const now = new Date();
      currentYear = now.getFullYear();
      currentMonth = now.getMonth();
      const yearSelect = document.getElementById("year-select");
      for (let y = 2020; y <= 2070; y++) {
        const option = document.createElement("option");
        option.value = y;
        option.textContent = y;
        if (y === currentYear) option.selected = true;
        yearSelect.appendChild(option);
      }
      renderCalendar(currentYear, currentMonth);

      document.getElementById("prev-month").addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar(currentYear, currentMonth);
      });
      document.getElementById("next-month").addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar(currentYear, currentMonth);
      });
      yearSelect.addEventListener("change", e => {
        currentYear = parseInt(e.target.value);
        renderCalendar(currentYear, currentMonth);
      });
      document.getElementById("delete-day-event").addEventListener("click", () => {
        const dayStr = prompt("삭제할 날짜(일)를 입력하세요 (예: 15):");
        if (dayStr) {
          const dayNum = parseInt(dayStr);
          const eventDiv = document.getElementById(`event-${currentYear}-${currentMonth+1}-${dayNum}`);
          if (eventDiv) {
            eventDiv.textContent = "";
            const message = `${currentYear}-${currentMonth+1}-${dayNum} 일정이 삭제되었습니다.`;
            alert(message);
            speakText(message);
          }
        }
      });
      document.getElementById("save-calendar").addEventListener("click", () => {
        saveCalendar();
        speakText("캘린더를 바탕화면에 저장했습니다.");
      });
    }

    function renderCalendar(year, month) {
      const monthNames = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
      document.getElementById("month-year-label").textContent = `${year}년 ${monthNames[month]}`;
      const grid = document.getElementById("calendar-grid");
      grid.innerHTML = "";
      const daysOfWeek = ["일","월","화","수","목","금","토"];
      daysOfWeek.forEach(day => {
        const th = document.createElement("div");
        th.style.fontWeight = "bold";
        th.style.textAlign = "center";
        th.textContent = day;
        th.style.color = "#00ffcc";
        th.style.textShadow = "0 0 3px #00ffcc";
        grid.appendChild(th);
      });
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month+1, 0).getDate();
      for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement("div"));
      for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement("div");
        cell.innerHTML = `<div class="day-number">${d}</div><div class="event" id="event-${year}-${month+1}-${d}"></div>`;
        cell.addEventListener("click", () => {
          const eventText = prompt(`${year}-${month+1}-${d} 일정 입력:`);
          if (eventText) {
            const eventDiv = document.getElementById(`event-${year}-${month+1}-${d}`);
            eventDiv.textContent = eventDiv.textContent ? `${eventDiv.textContent}; ${eventText}` : eventText;
            speakText(`${year}-${month+1}-${d}에 ${eventText} 일정을 추가했습니다.`);
          }
        });
        grid.appendChild(cell);
      }
    }

    function updateBubblePosition() {
      const bubble = document.getElementById("speech-bubble");
      const headWorldPos = new THREE.Vector3();
      head.getWorldPosition(headWorldPos);
      const screenPos = headWorldPos.project(camera);
      bubble.style.left = ((screenPos.x * 0.5 + 0.5) * window.innerWidth) + "px";
      bubble.style.top = ((1 - (screenPos.y * 0.5 + 0.5)) * window.innerHeight - 50) + "px";
    }

    // 초기화
    window.addEventListener("DOMContentLoaded", () => {
      const chatInput = document.getElementById("chat-input");
      chatInput.setAttribute("list", "chat-keywords");
      const autoCompleteList = document.createElement("datalist");
      autoCompleteList.id = "chat-keywords";
      Object.values(KEYWORDS).flat().forEach(kw => {
        const option = document.createElement("option");
        option.value = kw;
        autoCompleteList.appendChild(option);
      });
      document.body.appendChild(autoCompleteList);
      chatInput.addEventListener("keydown", e => { if (e.key === "Enter") sendChat(); });

      const regionSelect = document.getElementById("region-select");
      regionList.forEach(region => {
        const option = document.createElement("option");
        option.value = region;
        option.textContent = `${region} (${regionMap[region]})`;
        if (region === currentCity) option.selected = true;
        regionSelect.appendChild(option);
      });

      initThreeJS();
      initCalendar();
      updateMap();
      updateWeatherAndEffects();
    });
  </script>
</body>
</html>
