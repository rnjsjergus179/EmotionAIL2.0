
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>3D 캐릭터 HUD, 달력 & 말풍선 채팅</title>
  <style>
    /* (기존 스타일 코드 생략 - 위에 작성한 것과 동일) */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; font-family: 'Courier New', monospace; overflow: hidden; }
    /* ... (우측 채팅창, 좌측 캘린더, 캔버스 등 기존 CSS 그대로) ... */
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
  <script>
    // ==============================
    // 감정 키워드 및 응답 데이터 (부드럽고 다정한 AI 비서 스타일)
    // ==============================
    const emotionKeywords = {
      "슬픔": ["슬프", "구슬픔", "구슬퍼", "구픔", "눈물", "우울"],
      "미안": ["미안", "미안했", "몰랏", "모르겠"],
      "기쁨": ["기쁘", "행복", "웃", "기분좋아"],
      "분노": ["화난", "분노", "짜증"],
      "놀람": ["놀라", "깜짝", "신기", "대박"],
      "인사": ["안녕", "인사", "반가워"],
      "잘자": ["잘자", "편안한 밤"]
    };
    const emotionResponses = {
      "슬픔": [
        "정말로 슬퍼요... 😢 눈물이 절로 나네요.",
        "마음이 너무 아파요... 😭",
        "슬픔이 깊게 느껴져요... 😔",
        "그 슬픔, 함께 나누고 싶어요... 😢"
      ],
      "미안": [
        "정말 미안해요... 🙇‍♀️ 진심으로 사과드립니다.",
        "미안했어요... 🙇‍♂️",
        "내 잘못이에요... 정말 죄송해요. 😞",
        "미안하다는 말로는 부족하지만, 정말 죄송합니다. 🙏"
      ],
      "기쁨": [
        "기분 좋아요~ 😄 정말 행복해요!",
        "웃음이 절로 나네요! 😊",
        "오늘은 너무 즐거워요! 😆",
        "행복한 하루 보내세요! 😁"
      ],
      "분노": [
        "정말 화가 나네요... 😡 잠시 진정해보세요.",
        "분노가 치밀어요! 😠 조금 숨 고르세요.",
        "짜증이 가득해요... 😤 마음을 진정시키세요."
      ],
      "놀람": [
        "정말 놀라워요! 😲",
        "깜짝 놀랐어요! 😮",
        "세상이 참 신기하네요! 😳",
        "놀라움이 가득해요! 😯"
      ],
      "인사": [
        "안녕하세요, 주인님! 오늘 기분은 어떠세요? 😊",
        "반갑습니다, 주인님! 언제나 환영해요~ 😊",
        "안녕하십니까? 항상 곁에 있겠습니다. 🙂"
      ],
      "잘자": [
        "잘 자요, 좋은 꿈 꾸세요! 😴",
        "편안한 밤 되세요... 😌",
        "내일도 멋진 하루 되길 바랍니다! 🌙",
        "달콤한 꿈 꾸세요! 😴"
      ]
    };
    
    // ==============================
    // detectEmotion 함수
    // 입력 텍스트에서 미리 정의한 감정 키워드를 검색하여 해당 감정을 배열로 반환합니다.
    function detectEmotion(text) {
      const found = [];
      const lowerText = text.toLowerCase();
      for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        for (const keyword of keywords) {
          if (lowerText.includes(keyword)) {
            found.push(emotion);
            break;
          }
        }
      }
      return found;
    }
    
    // ==============================
    // 자모 조합 처리 함수
    // 입력된 문자열에서 각 단어별로 마침표(.)가 있으면 제거하여 완성된 단어로 결합합니다.
    function combineJamo(text) {
      return text.split(" ").map(word => {
        return word.indexOf(".") !== -1 ? word.replace(/\./g, "") : word;
      }).join(" ");
    }
    
    // ==============================
    // 단어 학습 관련 기능 (웹사이트 내용을 학습)
    // ==============================
    // 웹사이트 내용을 코드에 직접 붙여넣어 학습할 텍스트로 사용합니다.
    const attachedContent = `
다정한 사람의 말투는 부드럽고 따뜻해요.
그들은 언제나 진심 어린 미소와 함께, "안녕하세요, 오늘 기분 어떠세요?" 라고 인사해요.
또한 슬플 때는 "정말 속이 후련하지 않아요..." 라고 말하면서도, 작은 위로의 말도 잊지 않아요.
편안한 밤 되세요, 좋은 꿈 꾸세요 등 따뜻한 응원의 말도 자주 사용해요.
`; // 여기에 웹사이트에서 긍정적이거나 다정한 말투의 텍스트를 붙여넣습니다.

    // 간단한 토큰화 함수 (공백 및 특수문자 기준)
    function tokenize(text) {
      return text.replace(/[^\w가-힣\s]/g, "").toLowerCase().split(/\s+/);
    }
    
    // 단어 빈도를 저장할 객체
    const wordFrequencies = {};
    
    // 텍스트를 학습하는 함수: 단어를 토큰화해서 빈도수를 업데이트
    function learnFromText(text) {
      const tokens = tokenize(text);
      tokens.forEach(token => {
        if (token) {
          wordFrequencies[token] = (wordFrequencies[token] || 0) + 1;
        }
      });
      console.log("학습된 단어 빈도:", wordFrequencies);
    }
    
    // attachedContent를 학습 데이터로 활용
    learnFromText(attachedContent);
    
    // ==============================
    // 기본 기능: 지역, 날씨, 캘린더 등
    // ==============================
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
    let currentCity = "서울";
    let currentWeather = "";
    let blockUntil = 0;
    let danceInterval;
    
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
        return events.length ? `현재 월(${currentMonthStr})의 일정:\n${events.join("\n")}`
                             : `현재 월(${currentMonthStr})에는 일정이 없습니다.`;
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
      showSpeechBubbleInChunks(`지역이 ${value}(으)로 변경되었습니다.`);
    }
    
    // ==============================
    // 채팅 입력 처리 – 감정 키워드 및 자모 조합 처리
    // ==============================
    async function sendChat() {
      const inputEl = document.getElementById("chat-input");
      let input = inputEl.value.trim();
      
      if (Date.now() < blockUntil) {
        showSpeechBubbleInChunks("1시간동안 차단됩니다.");
        inputEl.value = "";
        return;
      }
      if (!input) return;
      
      // 자모 조합 처리
      input = combineJamo(input);
      
      let response = "";
      const lowerInput = input.toLowerCase();
      
      // 지역 변경 처리
      if (lowerInput.startsWith("지역 ")) {
        const newCity = lowerInput.replace("지역", "").trim();
        if (newCity) {
          if (regionList.includes(newCity)) {
            currentCity = newCity;
            document.getElementById("region-select").value = newCity;
            response = `지역이 ${newCity}(으)로 변경되었습니다.`;
            updateMap();
            await updateWeatherAndEffects();
          } else {
            response = "지원하지 않는 지역입니다. 드롭다운 메뉴에서 선택해주세요.";
          }
        } else {
          response = "변경할 지역을 입력해주세요.";
        }
      } else if (regionList.includes(lowerInput)) {
        currentCity = lowerInput;
        document.getElementById("region-select").value = lowerInput;
        response = `지역이 ${lowerInput}(으)로 변경되었습니다.`;
        updateMap();
        await updateWeatherAndEffects();
      }
      
      // 감정 키워드 분석 – detectEmotion() 함수 사용
      const detectedEmotions = detectEmotion(input);
      if (detectedEmotions.length > 0) {
        const emotion = detectedEmotions[0]; // 첫번째 감정만 처리
        const responses = emotionResponses[emotion];
        if (responses && responses.length > 0) {
          response = responses[Math.floor(Math.random() * responses.length)];
        }
      }
      
      // 기본 처리: 날씨, 시간, 캘린더 등
      if (!response) {
        if (lowerInput.includes("날씨") &&
            (lowerInput.includes("알려") || lowerInput.includes("어때") ||
             lowerInput.includes("뭐야") || lowerInput.includes("어떻게") || lowerInput.includes("맑아"))) {
          await updateWeatherAndEffects();
          return;
        } else if (lowerInput.includes("시간") || lowerInput.includes("몇시") || lowerInput.includes("현재시간")) {
          const now = new Date();
          const hours = now.getHours();
          const minutes = now.getMinutes();
          response = `현재 시간은 ${hours}시 ${minutes}분입니다.`;
        } else if (lowerInput.includes("파일 저장해줘")) {
          response = "파일 저장하겠습니다.";
          saveFile();
        } else if ((lowerInput.includes("캘린더") && lowerInput.includes("저장")) ||
                   lowerInput.includes("일정저장") ||
                   lowerInput.includes("하루일과저장")) {
          response = "캘린더 저장하겠습니다.";
          saveCalendar();
        } else if (lowerInput.includes("일정 삭제") || 
                   lowerInput.includes("하루일정 삭제") || 
                   lowerInput.includes("일정 삭제해줘") || 
                   lowerInput.includes("하루 일정 삭제")) {
          const dayStr = prompt("삭제할 일정의 날짜(일)를 입력하세요 (예: 15):");
          if (dayStr) {
            const dayNum = parseInt(dayStr);
            if (dayNum >= 1 && dayNum <= new Date(currentYear, currentMonth+1, 0).getDate()) {
              response = deleteCalendarEvent(dayNum);
            } else {
              response = "유효한 날짜를 입력해주세요.";
            }
          } else {
            response = "날짜를 입력하지 않으셨습니다.";
          }
        } else if (lowerInput.includes("일정 알려줘") || 
                   lowerInput.includes("일정 알려") || 
                   lowerInput.includes("일정 확인")) {
          const dateMatch = input.match(/\d{4}-\d{1,2}-\d{1,2}/);
          if (dateMatch) {
            const dateStr = dateMatch[0];
            response = getCalendarEvents(dateStr);
          } else {
            response = getCalendarEvents();
          }
        } else if (lowerInput.includes("안녕")) {
          response = "안녕하세요, 주인님! 오늘 기분은 어떠세요?";
          characterGroup.children[7].rotation.z = Math.PI / 4;
          setTimeout(() => { characterGroup.children[7].rotation.z = 0; }, 1000);
        } else if (lowerInput.includes("캐릭터 넌 누구야")) {
          response = "저는 당신의 부드럽고 다정한 비서입니다.";
        } else if (lowerInput.includes("일정")) {
          response = "캘린더는 왼쪽에서 확인하세요.";
        } else if (lowerInput.includes("캐릭터 춤춰줘") ||
                   lowerInput.includes("춤") ||
                   lowerInput.includes("춤춰") ||
                   lowerInput.includes("춤춰줘") ||
                   lowerInput.includes("춤춰봐") ||
                   lowerInput.includes("춤사위")) {
          response = "춤추겠습니다! 잠시만 기다려 주세요.";
          if (danceInterval) clearInterval(danceInterval);
          danceInterval = setInterval(() => {
            characterGroup.children[7].rotation.z = Math.sin(Date.now() * 0.01) * Math.PI / 4;
            head.rotation.y = Math.sin(Date.now() * 0.01) * Math.PI / 8;
          }, 50);
          setTimeout(() => {
            clearInterval(danceInterval);
            characterGroup.children[7].rotation.z = 0;
            head.rotation.y = 0;
          }, 3000);
        } else {
          response = "죄송합니다. 잘 이해하지 못했습니다. 다시 말씀해주시겠어요?";
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
        return { message: `오늘 ${currentCity}의 날씨는 ${description}이며, 온도는 ${temp}°C입니다.${extraComment}` };
      } catch (err) {
        currentWeather = "";
        return { message: `날씨 정보를 가져오지 못했습니다: ${currentCity}` };
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
    <!-- 파일 업로드 관련 요소는 제거되었습니다 -->
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
        <strong>채팅창:</strong> 상단 드롭다운 메뉴에서 지역을 선택하면 지도와 날씨가 즉시 업데이트됩니다.<br>
        또는 "지역 [지역명]" (예: "지역 인천" 또는 "인천") 입력으로도 변경 가능합니다.<br>
        "날씨 알려줘"로 현재 지역의 날씨를 다시 확인할 수 있습니다.<br>
        "일정 삭제" 또는 "하루일정 삭제"를 입력해 캘린더 일정을 삭제할 수 있습니다.<br>
        "일정 알려줘"를 입력해 저장된 일정을 확인할 수 있습니다 (예: "2025-4-15 일정 알려줘").
      </p>
      <p><strong>캘린더:</strong> 왼쪽에서 날짜 클릭해 일정을 추가하거나, 버튼으로 저장/삭제하세요.</p>
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
</body>
</html>
