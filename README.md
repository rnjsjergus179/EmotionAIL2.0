
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>3D 캐릭터 HUD, 달력 & 말풍선 채팅</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; font-family: 'Courier New', monospace; overflow: hidden; }
    
    /* 오른쪽 채팅창 HUD */
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
    #chat-log {
      display: none;
      height: 100px;
      overflow-y: scroll;
      border: 1px solid #ccc;
      padding: 5px;
      margin-top: 10px;
      border-radius: 3px;
      background: #fff;
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
    /* HUD-6: 음성 입력 영역 (채팅창 하단 중앙) */
    #hud-6 {
      text-align: center;
      margin-top: 10px;
    }
    #voice-btn {
      padding: 5px 10px;
      font-size: 14px;
      cursor: pointer;
      border: none;
      border-radius: 5px;
      background: #00cc99;
      color: #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transition: background 0.3s;
    }
    #voice-btn:hover {
      background: #00aa88;
    }
    
    /* 왼쪽 캘린더 HUD */
    #left-hud {
      position: fixed;
      top: 10%;
      left: 1%;
      width: 20%;
      padding: 1%;
      background: rgba(0,0,0,0.7);
      border: 2px solid #00ffcc;
      border-radius: 10px;
      box-shadow: 0 0 15px rgba(0,255,204,0.5);
      z-index: 20;
      max-height: 80vh;
      overflow-y: auto;
      color: #00ffcc;
    }
    #left-hud h3 { margin-bottom: 5px; text-shadow: 0 0 5px #00ffcc; }
    #calendar-container { margin-top: 10px; }
    #calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    #calendar-header button {
      padding: 2px 6px;
      font-size: 12px;
      cursor: pointer;
      background: #00ffcc;
      color: #000;
      border: none;
      border-radius: 3px;
      box-shadow: 0 0 5px #00ffcc;
      transition: all 0.3s;
    }
    #calendar-header button:hover {
      background: #00cc99;
      box-shadow: 0 0 10px #00ffcc;
    }
    #month-year-label { font-weight: bold; font-size: 14px; text-shadow: 0 0 5px #00ffcc; }
    #year-select {
      font-size: 12px;
      padding: 2px;
      margin-left: 5px;
      background: #333;
      color: #00ffcc;
      border: 1px solid #00ffcc;
      border-radius: 3px;
    }
    #calendar-actions { margin-top: 5px; text-align: center; }
    #calendar-actions button {
      margin: 2px;
      padding: 5px 8px;
      font-size: 12px;
      cursor: pointer;
      background: #00ffcc;
      color: #000;
      border: none;
      border-radius: 3px;
      box-shadow: 0 0 5px #00ffcc;
      transition: all 0.3s;
    }
    #calendar-actions button:hover {
      background: #00cc99;
      box-shadow: 0 0 10px #00ffcc;
    }
    #calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }
    #calendar-grid div {
      background: rgba(255,255,255,0.1);
      border: 1px solid #00ffcc;
      border-radius: 4px;
      min-height: 25px;
      font-size: 10px;
      padding: 2px;
      position: relative;
      cursor: pointer;
      transition: all 0.3s;
    }
    #calendar-grid div:hover {
      background: rgba(0,255,204,0.3);
      box-shadow: 0 0 5px #00ffcc;
    }
    .day-number {
      position: absolute;
      top: 2px;
      left: 2px;
      font-weight: bold;
      font-size: 10px;
      color: #00ffcc;
      text-shadow: 0 0 3px #00ffcc;
    }
    .event {
      margin-top: 14px;
      font-size: 8px;
      color: #00ffcc;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-shadow: 0 0 3px #00ffcc;
    }
    
    /* 메인 캔버스와 말풍선 */
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
    
    /* 지도 또는 유튜브가 표시되는 영역 */
    #hud-3 {
      position: fixed;
      top: 70%;
      right: 1%;
      width: 20%;
      height: 20%;
      padding: 1%;
      background: rgba(255,255,255,0.9);
      border-radius: 5px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 20;
      overflow: hidden;
    }
    
    /* 튜토리얼 오버레이 */
    #tutorial-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 100;
      opacity: 0;
      transition: opacity 1s ease-in-out;
      pointer-events: none;
    }
    #tutorial-content {
      text-align: center;
      padding: 20px;
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      max-width: 600px;
    }
    #tutorial-content h2 { margin-bottom: 15px; }
    #tutorial-content p { margin: 10px 0; font-size: 14px; }
    
    /* 버전 선택 메뉴 */
    #version-select {
      position: fixed;
      bottom: 10px;
      left: 10px;
      z-index: 50;
    }
    #version-select select {
      padding: 5px;
      font-size: 12px;
    }
    
    @media (max-width: 480px) {
      #right-hud, #left-hud, #hud-3 { width: 90%; left: 5%; right: 5%; top: 5%; }
    }
  </style>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
  
  <script>
    document.addEventListener("contextmenu", event => event.preventDefault());
    let blockUntil = 0;
    let danceInterval;
    let currentCity = "서울";
    let currentWeather = "";
    
    document.addEventListener("copy", function(e) {
      e.preventDefault();
      let selectedText = window.getSelection().toString();
      selectedText = selectedText.replace(/2caa7fa4a66f2f8d150f1da93d306261/g, "HIDDEN");
      e.clipboardData.setData("text/plain", selectedText);
      if (Date.now() < blockUntil) return;
      blockUntil = Date.now() + 3600000;
      showSpeechBubbleInChunks("1시간동안 차단됩니다.");
    });
    
    const weatherKey = "2caa7fa4a66f2f8d150f1da93d306261";
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
    
    function saveFile() {
      const content = "파일 저장 완료";
      const filename = "saved_file.txt";
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
      localStorage.setItem("calendarEvents", JSON.stringify(calendarData));
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(calendarData, null, 2));
      const dlAnchorElem = document.createElement("a");
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute("download", "calendar_events.json");
      dlAnchorElem.style.display = "none";
      document.body.appendChild(dlAnchorElem);
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
      } else {
        return "해당 날짜에 일정이 없습니다.";
      }
    }
    
    function getCalendarEvents(dateStr = null) {
      const calendarData = JSON.parse(localStorage.getItem("calendarEvents") || "{}");
      if (!Object.keys(calendarData).length) {
        return "저장된 일정이 없습니다. 먼저 캘린더를 저장해주세요.";
      }
      
      if (dateStr) {
        if (calendarData[dateStr]) {
          return `${dateStr}의 일정: ${calendarData[dateStr]}`;
        } else {
          return `${dateStr}에는 일정이 없습니다.`;
        }
      } else {
        const currentMonthStr = `${currentYear}-${currentMonth+1}`;
        let events = [];
        for (let key in calendarData) {
          if (key.startsWith(currentMonthStr)) {
            events.push(`${key}: ${calendarData[key]}`);
          }
        }
        if (events.length) {
          return `현재 월(${currentMonthStr})의 일정:\n${events.join("\n")}`;
        } else {
          return `현재 월(${currentMonthStr})에는 일정이 없습니다.`;
        }
      }
    }
    
    function updateMap() {
      const englishCity = regionMap[currentCity] || "Seoul";
      document.getElementById("map-iframe").src = `https://www.google.com/maps?q=${encodeURIComponent(englishCity)}&output=embed`;
    }
    
    async function updateWeatherAndEffects(sendMessage = true) {
      const weatherData = await getWeather();
      if (sendMessage) {
        showSpeechBubbleInChunks(weatherData.message);
      }
      updateWeatherEffects();
    }
    
    function changeRegion(value) {
      currentCity = value;
      updateMap();
      updateWeatherAndEffects();
      showSpeechBubbleInChunks(`지역이 ${value}(으)로 변경되었어요.`);
    }
    
    // 업그레이드된 캐릭터 대화 처리 함수 (감정, 유튜브, 반가움, 잘자 등 다양한 키워드 처리)
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
      
      // 지역 변경 처리
      if (lowerInput.startsWith("지역 ")) {
        const newCity = lowerInput.replace("지역", "").trim();
        if(newCity) {
          if (regionList.includes(newCity)) {
            currentCity = newCity;
            document.getElementById("region-select").value = newCity;
            response = `좋아요, 지역을 ${newCity}(으)로 변경할게요!`;
            updateMap();
            await updateWeatherAndEffects();
          } else {
            response = "죄송해요, 그 지역은 지원하지 않아요. 드롭다운 메뉴에서 선택해주세요.";
          }
        } else {
          response = "변경할 지역을 입력해 주세요.";
        }
      } else if (regionList.includes(input)) {
        currentCity = input;
        document.getElementById("region-select").value = input;
        response = `좋아요, 지역을 ${input}(으)로 변경할게요!`;
        updateMap();
        await updateWeatherAndEffects();
      }
      
      // "유튜브" 관련 키워드 처리 – 유튜브 관련 단어가 나오면 페이지 전체 리디렉션
      const youtubeKeywords = ["유튜브", "유트브", "유튜브알려줘", "유튭", "유튜브랑", "유튜브나와줘"];
      if (!response && youtubeKeywords.some(keyword => lowerInput.indexOf(keyword) !== -1)) {
        response = "유튜브를 보여드릴게요! 잠시만 기다려 주세요.";
        showSpeechBubbleInChunks(response);
        setTimeout(() => {
          window.location.href = "https://www.youtube.com/";
        }, 2000);
        inputEl.value = "";
        return;
      }
      
      // 반갑 관련 키워드 처리
      if (!response && lowerInput.indexOf("반갑") !== -1) {
        response = "정말 반가워요~😉 오늘 기분은 어떠세요?";
      }
      
      // "잘자" 관련 키워드 처리
      const sleepKeywords = ["잘자", "좋은꿈", "좋은 꿈", "잘자요", "잘자시게", "잘자리요", "잘자라니께"];
      if (!response && sleepKeywords.some(keyword => lowerInput.indexOf(keyword) !== -1)) {
        response = "편안한 밤 되세요, 좋은 꿈 꾸세요~";
      }
      
      // 다양한 '알려줘' 관련 기능 (날씨, 일정, 시간 등)
      if (!response) {
        if (lowerInput.includes("날씨") &&
           (lowerInput.includes("알려줘") || lowerInput.includes("어때") || lowerInput.includes("맑아"))) {
          await updateWeatherAndEffects();
          inputEl.value = "";
          return;
        }
        if (lowerInput.includes("일정") && lowerInput.includes("알려줘")) {
          const dateMatch = input.match(/\d{4}-\d{1,2}-\d{1,2}/);
          if (dateMatch) {
            const dateStr = dateMatch[0];
            response = getCalendarEvents(dateStr);
          } else {
            response = getCalendarEvents();
          }
        }
        if (lowerInput.includes("시간") || lowerInput.includes("몇시") || lowerInput.includes("현재시간")) {
          const now = new Date();
          const hours = now.getHours();
          const minutes = now.getMinutes();
          response = `현재 시간은 ${hours}시 ${minutes}분입니다.`;
        }
      }
      
      // 업그레이드된 감정 표현 및 일반 대화 응답
      if (!response) {
        if (lowerInput.includes("기분") || lowerInput.includes("슬프") || lowerInput.includes("우울") ||
            lowerInput.includes("짜증") || lowerInput.includes("화난") || lowerInput.includes("분노") ||
            lowerInput.includes("피곤") || lowerInput.includes("지쳤")) {
          const sadResponses = [
            "정말 마음이 아프시네요. 혹시 도움이 필요하시면 말씀해 주세요.",
            "그런 날도 있죠. 천천히 쉬시면서 마음을 달래보세요.",
            "힘들어 보이시네요. 조금만 더 힘내시길 바랄게요."
          ];
          const happyResponses = [
            "오늘 정말 즐거워 보이세요! 행복한 일들만 가득하길 바랍니다.",
            "당신의 미소가 주변을 환하게 만드네요. 기분 좋은 하루 되세요!",
            "기쁨이 넘치는 하루, 함께 웃어요!"
          ];
          const angryResponses = [
            "화가 치밀어 오시네요. 잠시 심호흡을 해보세요.",
            "분노가 느껴지네요. 잠시 멈추고 다시 마음을 가다듬어 보세요.",
            "감정이 격해지셨다면, 잠깐의 휴식이 도움이 될 거예요."
          ];
          const neutralResponses = [
            "그렇군요, 좀 더 자세히 말씀해 주실 수 있을까요?",
            "알겠습니다. 혹시 추가로 궁금한 점은 없으신가요?",
            "흥미로운 이야기네요. 더 들려주세요!"
          ];
          
          if (lowerInput.includes("슬프") || lowerInput.includes("우울") || lowerInput.includes("지쳤")) {
            response = sadResponses[Math.floor(Math.random() * sadResponses.length)];
          } else if (lowerInput.includes("기쁘") || lowerInput.includes("행복")) {
            response = happyResponses[Math.floor(Math.random() * happyResponses.length)];
          } else if (lowerInput.includes("화난") || lowerInput.includes("분노") || lowerInput.includes("짜증")) {
            response = angryResponses[Math.floor(Math.random() * angryResponses.length)];
          } else if (lowerInput.includes("피곤")) {
            response = "피곤하신가요? 푹 쉬시고 내일 더 힘내세요.";
          } else {
            response = neutralResponses[Math.floor(Math.random() * neutralResponses.length)];
          }
        } else {
          const generalResponses = [
            "정말 흥미로운 이야기네요. 더 들려주세요!",
            "알겠습니다. 혹시 다른 궁금한 점은 없으신가요?",
            "그렇군요. 당신의 의견을 듣고 있으니 저도 많이 배워요.",
            "그렇게 느끼실 수 있겠어요. 함께 이야기 나눠봐요!"
          ];
          response = generalResponses[Math.floor(Math.random() * generalResponses.length)];
        }
      }
      
      showSpeechBubbleInChunks(response);
      inputEl.value = "";
    }
    
    async function getWeather() {
      try {
        const englishCity = regionMap[currentCity] || "Seoul";
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(englishCity)}&appid=${weatherKey}&units=metric&lang=kr`;
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
        } else if (description.indexOf("비") !== -1 || description.indexOf("소나기") !== -1) {
          extraComment = " 오늘은 비가 오네요 ☔";
        }
        return {
          message: `오늘 ${currentCity}의 날씨는 ${description}이며, 온도는 ${temp}°C입니다.${extraComment}`
        };
      } catch (err) {
        currentWeather = "";
        return { message: `죄송합니다, ${currentCity}의 날씨 정보를 가져오지 못했어요.` };
      }
    }
    
    function updateWeatherEffects() {
      if (!currentWeather) return;
      if (currentWeather.indexOf("비") !== -1 || currentWeather.indexOf("소나기") !== -1) {
        rainGroup.visible = true;
        houseCloudGroup.visible = false;
      } else if (currentWeather.indexOf("구름") !== -1 || currentWeather.indexOf("흐림") !== -1) {
        rainGroup.visible = false;
        houseCloudGroup.visible = true;
      } else {
        rainGroup.visible = false;
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
    });
    
    window.addEventListener("resize", function(){
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    window.addEventListener("load", async () => {
      initCalendar();
      showTutorial();
      updateMap();
      await updateWeatherAndEffects();
    });
    
    function changeVersion(version) {
      if (version === "1.3") {
        window.location.href = "https://aipersonalassistant.neocities.org/";
      } else if (version === "latest") {
        window.location.reload();
      }
    }
    
    // 음성 입력 기능 (HUD-6) 구현 (Web Speech API 사용, 지원 브라우저에서만 작동)
    let recognition;
    if ('webkitSpeechRecognition' in window) {
      recognition = new webkitSpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById("chat-input").value = transcript;
      };
      recognition.onerror = function(event) {
        console.error("음성 인식 에러:", event.error);
      };
    } else {
      console.warn("이 브라우저는 음성 인식을 지원하지 않습니다.");
    }
    
    function startVoiceRecognition() {
      if (recognition) {
        recognition.start();
      }
    }
  </script>
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
    <!-- HUD-6: 음성 입력 영역 -->
    <div id="hud-6">
      <button id="voice-btn" onclick="startVoiceRecognition()">🎤 음성 입력</button>
    </div>
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
  
  <div id="tutorial-overlay">
    <div id="tutorial-content">
      <h2>사용법 안내</h2>
      <p><strong>캐릭터:</strong> 채팅창에 "안녕", "캐릭터 춤춰줘" 등 입력해 보세요.</p>
      <p>
        <strong>채팅창:</strong> 상단 드롭다운 메뉴에서 지역을 선택하면 지도와 날씨가 업데이트됩니다.<br>
        "유튜브 보여줘", "유튜브알려줘" 등 유튜브 관련 키워드를 입력하면 페이지 전체가 유튜브로 전환됩니다.<br>
        "날씨 알려줘", "일정 알려줘", "시간 알려줘" 등 다양한 질문에도 응답합니다.<br>
        "잘자" 관련 키워드가 나오면 편안한 밤 인사도 드려요!
      </p>
      <p><strong>캘린더:</strong> 왼쪽에서 날짜를 클릭해 일정을 추가하거나, 버튼으로 저장/삭제할 수 있습니다.</p>
      <p><strong>버전 선택:</strong> 하단 드롭다운에서 "구버전 1.3" 또는 "최신 버전 (1.7)"을 선택해 해당 페이지로 이동하세요.</p>
    </div>
  </div>
  
  <div id="version-select">
    <select onchange="changeVersion(this.value)">
      <option value="latest">최신 버전 (1.7)</option>
      <option value="1.3">구버전 1.3</option>
    </select>
  </div>
  
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
    
    const sunMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xff9900, transparent: true, opacity: 0 });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(1.5, 64, 64), sunMaterial);
    scene.add(sun);
    
    const moonMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, emissive: 0x222222, transparent: true, opacity: 1 });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 64), moonMaterial);
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
    
    const floorGeometry = new THREE.PlaneGeometry(400, 400, 128, 128);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 1, metalness: 0 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI/2;
    floor.position.y = -2;
    scene.add(floor);
    
    const backgroundGroup = new THREE.Group();
    scene.add(backgroundGroup);
    function createBuilding(width, height, depth, color) {
      const buildingGroup = new THREE.Group();
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.1 });
      const building = new THREE.Mesh(geometry, material);
      buildingGroup.add(building);
      
      const windowMat = new THREE.MeshStandardMaterial({ color: 0x87CEEB });
      for (let y = 3; y < height - 1; y += 2) {
        for (let x = -width/2 + 0.5; x < width/2; x += 1) {
          const window = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.1), windowMat);
          window.position.set(x, y - height/2, depth/2 + 0.01);
          buildingGroup.add(window);
        }
      }
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const door = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1), doorMat);
      door.position.set(0, -height/2 + 1, depth/2 + 0.01);
      buildingGroup.add(door);
      
      return buildingGroup;
    }
    function createHouse(width, height, depth, baseColor, roofColor) {
      const houseGroup = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth),
                                  new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.8 }));
      base.position.y = -2 + height/2;
      houseGroup.add(base);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(width * 0.8, height * 0.6, 4),
                                  new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.8 }));
      roof.position.y = -2 + height + (height * 0.6)/2;
      roof.rotation.y = Math.PI/4;
      houseGroup.add(roof);
      
      const windowMat = new THREE.MeshStandardMaterial({ color: 0xFFFFE0 });
      const window1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), windowMat);
      window1.position.set(-width/4, -2 + height/2, depth/2 + 0.01);
      const window2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), windowMat);
      window2.position.set(width/4, -2 + height/2, depth/2 + 0.01);
      houseGroup.add(window1, window2);
      
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const door = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.1), doorMat);
      door.position.set(0, -2 + height/4, depth/2 + 0.01);
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
      building.position.set(x, -2 + height/2, z);
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
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 8),
                                    new THREE.MeshBasicMaterial({ color: 0x333333 }));
      pole.position.y = 2;
      lightGroup.add(pole);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8),
                                    new THREE.MeshBasicMaterial({ color: 0xffcc00 }));
      lamp.position.y = 4.2;
      lightGroup.add(lamp);
      const lampLight = new THREE.PointLight(0xffcc00, 1, 10);
      lampLight.position.set(0, 4.2, 0);
      lightGroup.add(lampLight);
      return lightGroup;
    }
    const characterStreetlight = createStreetlight();
    characterStreetlight.position.set(1, -2, 0);
    scene.add(characterStreetlight);
    
    let rainGroup = new THREE.Group();
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
      const rainMaterial = new THREE.PointsMaterial({ color: 0xaaaaee, size: 0.1, transparent: true, opacity: 0.6 });
      const rainParticles = new THREE.Points(rainGeometry, rainMaterial);
      rainGroup.add(rainParticles);
    }
    initRain();
    rainGroup.visible = false;
    
    let houseCloudGroup = new THREE.Group();
    function createHouseCloud() {
      const cloud = new THREE.Group();
      const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
      const sphere1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), cloudMat);
      sphere1.position.set(0, 0, 0);
      const sphere2 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), cloudMat);
      sphere2.position.set(0.6, 0.2, 0);
      const sphere3 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), cloudMat);
      sphere3.position.set(-0.6, 0.1, 0);
      cloud.add(sphere1, sphere2, sphere3);
      cloud.userData.initialPos = cloud.position.clone();
      return cloud;
    }
    const singleCloud = createHouseCloud();
    houseCloudGroup.add(singleCloud);
    houseCloudGroup.position.set(0, 2, 0);
    scene.add(houseCloudGroup);
    function updateHouseClouds() {
      const headWorldPos = new THREE.Vector3();
      head.getWorldPosition(headWorldPos);
      houseCloudGroup.position.x = headWorldPos.x + Math.sin(Date.now() * 0.001) * 1;
      houseCloudGroup.position.y = headWorldPos.y + 1;
      houseCloudGroup.position.z = headWorldPos.z;
    }
    
    let lightningLight = new THREE.PointLight(0xffffff, 0, 500);
    lightningLight.position.set(0, 50, 0);
    scene.add(lightningLight);
    
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
    characterGroup.add(charBody, head, leftEye, rightEye, mouth, leftBrow, rightBrow, leftArm, rightArm, leftLeg, rightLeg);
    characterGroup.position.y = -1;
    scene.add(characterGroup);
    const characterLight = new THREE.PointLight(0xffee88, 1, 15);
    scene.add(characterLight);
    
    function createTree() {
      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2, 16), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
      trunk.position.y = -1;
      const foliage = new THREE.Mesh(new THREE.ConeGeometry(1, 3, 16), new THREE.MeshStandardMaterial({ color: 0x228B22 }));
      foliage.position.y = 0.5;
      treeGroup.add(trunk, foliage);
      return treeGroup;
    }
    
    for (let i = 0; i < 10; i++) {
      const tree = createTree();
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
      if (t < 6) { sunOpacity = 0; moonOpacity = 1; }
      else if (t < 7) { let factor = (t - 6); sunOpacity = factor; moonOpacity = 1 - factor; }
      else if (t < 17) { sunOpacity = 1; moonOpacity = 0; }
      else if (t < 18) { let factor = (t - 17); sunOpacity = 1 - factor; moonOpacity = factor; }
      else { sunOpacity = 0; moonOpacity = 1; }
      sun.material.opacity = sunOpacity;
      moon.material.opacity = moonOpacity;
      
      const isDay = (t >= 7 && t < 17);
      scene.background = new THREE.Color(isDay ? 0x87CEEB : 0x000033);
      stars.forEach(s => s.visible = !isDay);
      fireflies.forEach(f => f.visible = !isDay);
      
      characterStreetlight.traverse(child => {
        if (child instanceof THREE.PointLight) { child.intensity = isDay ? 0 : 1; }
      });
      characterLight.position.copy(characterGroup.position).add(new THREE.Vector3(0, 5, 0));
      characterLight.intensity = isDay ? 0 : 1;
      characterGroup.position.y = -1;
      characterGroup.rotation.x = 0;
      
      updateWeatherEffects();
      updateHouseClouds();
      updateLightning();
      characterStreetlight.position.set(characterGroup.position.x + 1, -2, characterGroup.position.z);
      updateBubblePosition();
      
      renderer.render(scene, camera);
    }
    animate();
    
    let currentYear, currentMonth;
    function initCalendar() {
      const now = new Date();
      currentYear = now.getFullYear();
      currentMonth = now.getMonth();
      populateYearSelect();
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
      document.getElementById("year-select").addEventListener("change", (e) => {
        currentYear = parseInt(e.target.value);
        renderCalendar(currentYear, currentMonth);
      });
      
      document.getElementById("delete-day-event").addEventListener("click", () => {
        const dayStr = prompt("삭제할 하루일정의 날짜(일)를 입력하세요 (예: 15):");
        if(dayStr) {
          const dayNum = parseInt(dayStr);
          const eventDiv = document.getElementById(`event-${currentYear}-${currentMonth+1}-${dayNum}`);
          if(eventDiv) {
            eventDiv.textContent = "";
            alert(`${currentYear}-${currentMonth+1}-${dayNum} 일정이 삭제되었습니다. 다시 입력할 수 있습니다.`);
          }
        }
      });
      
      document.getElementById("save-calendar").addEventListener("click", () => {
        saveCalendar();
      });
    }
    function populateYearSelect() {
      const yearSelect = document.getElementById("year-select");
      yearSelect.innerHTML = "";
      for(let y = 2020; y <= 2070; y++){
        const option = document.createElement("option");
        option.value = y;
        option.textContent = y;
        if(y === currentYear) option.selected = true;
        yearSelect.appendChild(option);
      }
    }
    function renderCalendar(year, month) {
      const monthNames = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
      document.getElementById("month-year-label").textContent = `${year}년 ${monthNames[month]}`;
      const grid = document.getElementById("calendar-grid");
      grid.innerHTML = "";
      const daysOfWeek = ["일","월","화","수","목","금","토"];
      daysOfWeek.forEach((day) => {
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
      for(let i = 0; i < firstDay; i++){
        grid.appendChild(document.createElement("div"));
      }
      for(let d = 1; d <= daysInMonth; d++){
        const cell = document.createElement("div");
        cell.innerHTML = `<div class="day-number">${d}</div>
                          <div class="event" id="event-${year}-${month+1}-${d}"></div>`;
        cell.addEventListener("click", () => {
          const eventText = prompt(`${year}-${month+1}-${d} 일정 입력:`);
          if(eventText) {
            const eventDiv = document.getElementById(`event-${year}-${month+1}-${d}`);
            if(eventDiv.textContent) {
              eventDiv.textContent += "; " + eventText;
            } else {
              eventDiv.textContent = eventText;
            }
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
    
    function showTutorial() {
      const overlay = document.getElementById("tutorial-overlay");
      overlay.style.display = "flex";
      setTimeout(() => { overlay.style.opacity = "1"; }, 10);
      setTimeout(() => {
        overlay.style.opacity = "0";
        setTimeout(() => { overlay.style.display = "none"; }, 1000);
      }, 4000);
    }
    
    // 음성 입력 기능 (HUD-6) 구현 (Web Speech API 사용)
    let recognition;
    if ('webkitSpeechRecognition' in window) {
      recognition = new webkitSpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById("chat-input").value = transcript;
      };
      recognition.onerror = function(event) {
        console.error("음성 인식 에러:", event.error);
      };
    } else {
      console.warn("이 브라우저는 음성 인식을 지원하지 않습니다.");
    }
    
    function startVoiceRecognition() {
      if (recognition) {
        recognition.start();
      }
    }
  </script>
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
    <!-- HUD-6: 음성 입력 영역 -->
    <div id="hud-6">
      <button id="voice-btn" onclick="startVoiceRecognition()">🎤 음성 입력</button>
    </div>
  </div>
  
  <div id="hud-3">
    <iframe id="map-iframe" src="https://www.google.com/maps?q=Seoul&output=embed" frameborder="0" style="width:100%; height:100%; border:0;" allowfullscreen></iframe>
  </div>
  
  <div id="left-hud">
    <h3>캘린더</h3>
    <div id="calendar-container">
      <div id
