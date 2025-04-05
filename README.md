
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>3D 캐릭터 HUD, 달력 & 말풍선 채팅</title>
  <style>
    /* (기존 CSS 그대로) */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; font-family: 'Courier New', monospace; overflow: hidden; }
    /* ... 이하 동일 ... */
  </style>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
  
  <script>
    /***************************************************************
     * (1) 감정 키워드 목록 (기존 그대로)
     ***************************************************************/
    const emotionKeywords = {
      "슬픔": [
        "슬프","구슬픔","구슬퍼","구픔","눈물","우울","울적","공허",
        "슬퍼와","슬퍼이","슬퍼야","슬퍼라","슬퍼런","슬퍼서"
      ],
      "미안": ["미안", "미안했", "몰랏", "모르겠", "죄송", "사과"],
      "기쁨": ["기쁘", "행복", "웃", "기분좋아", "좋아", "설레", "벅차"],
      "분노": ["화난", "분노", "짜증", "폭발", "열받", "빡쳐"],
      "놀람": ["놀라", "깜짝", "신기", "대박", "당황", "충격", "믿기지 않"],
      "인사": ["안녕", "인사", "반가워"],
      "잘자": ["잘자", "편안한 밤"],
      "불안": ["불안", "걱정", "초조", "심장이 떨려", "앞이 캄캄", "근심"],
      "두려움": ["무서워", "두려움", "겁이 나", "소름", "떨려", "도망가고"],
      "사랑": ["사랑해", "보고 싶", "애틋", "마음 다 주고", "당신만 생각", "소중해"],
      "감사": ["감사", "감동", "고마워", "힘이 나", "큰 힘", "잊지 않을게"]
    };

    /***************************************************************
     * (2) 감정별 ‘원본 문장’ (기존)
     ***************************************************************/
    const emotionResponsesOriginal = {
      "슬픔": [
        "정말로 슬퍼... 😢 눈물이 절로 나네요.",
        "마음이 너무 아파요... 😭",
        "슬픔이 깊게 느껴져요... 😔",
        "그 슬픔, 함께 나누고 싶어요... 😢",
        "마음이 너무 아파요.",
        "울적해요.",
        "눈물이 나려고 해요.",
        "마음이 공허해요.",
        "위로가 필요해요.",
        "무엇 때문인지 모르게 가슴 한편이 먹먹하고 텅 빈 것 같아서 쉽게 웃음이 나오지 않아요.",
        "오늘따라 작은 일에도 눈물이 차올라서, 이 감정을 어떻게 달래야 할지 모르겠어요.",
        "슬픈 감정이 파도처럼 밀려와서 온몸을 덮어버린 듯한 느낌에 벗어나기가 힘드네요.",
        "슬퍼와 무기력이 한꺼번에 밀려오니 숨 쉴 틈도 없네요.",
        "슬퍼이 울부짖는 마음을 도무지 다스릴 수가 없어요.",
        "슬퍼야 할 것 같은 순간인데도 오히려 눈물이 안 나서 더 답답해요.",
        "아, 슬퍼라... 마음이 무너지는 기분이에요.",
        "슬퍼런 추억들이 문득 떠올라 밤새 마음이 무거웠어요.",
        "너무 슬퍼서 오늘은 아무것도 손에 잡히지 않아요."
      ],
      "미안": [
        "정말 미안해요... 🙇‍♀️ 진심으로 사과드립니다.",
        /* ... 이하 동일 ... */
      ],
      "기쁨": [
        "기분 좋아~ 😄 정말 행복해요!",
        /* ... 이하 동일 ... */
      ],
      "분노": [
        "정말 화가 나네요... 😡 잠시 진정해보세요.",
        /* ... 이하 동일 ... */
      ],
      "놀람": [
        "정말 놀라워요! 😲",
        /* ... 이하 동일 ... */
      ],
      "인사": [
        "안녕하세요, 주인님! 오늘 기분은 어떠세요? 😊",
        "반갑습니다, 주인님! 언제나 환영해요~ 😊",
        "안녕하십니까? 항상 곁에 있겠습니다. 🙂"
      ],
      "잘자": [
        "잘 자요, 좋은 꿈 꾸세요! 😴",
        /* ... 이하 동일 ... */
      ],
      "불안": [
        "너무 걱정돼요.",
        /* ... 이하 동일 ... */
      ],
      "두려움": [
        "무서워요.",
        /* ... 이하 동일 ... */
      ],
      "사랑": [
        "정말 사랑해요.",
        /* ... 이하 동일 ... */
      ],
      "감사": [
        "진심으로 감사해요.",
        /* ... 이하 동일 ... */
      ]
    };

    /***************************************************************
     * (3) 문장들을 ‘토큰화’해 저장할 새 구조
     ***************************************************************/
    const emotionResponsesTokens = {};

    // 간단한 토큰화 함수 (공백+문장부호 위주)
    function tokenizeSentence(line) {
      // 예: "정말로 슬퍼... 😢 눈물이 절로 나네요."
      // => ["정말로", "슬퍼", "...", "😢", "눈물이", "절로", "나네요."]
      // 실제론 더 복잡한 정규식 / 형태소 분석을 써야 할 수도 있음
      return line
        .split(/(\s+|[\.\,\!\?\:\;]+|…|ㅋ|ㅠ|~|[\u{1F600}-\u{1F6FF}]+)/u)  // 간단한 예시
        .map(token => token.trim())
        .filter(token => token.length > 0);
    }

    // 원본 문장들을 token화 해서 저장
    for (const [emotion, lines] of Object.entries(emotionResponsesOriginal)) {
      emotionResponsesTokens[emotion] = lines.map(line => tokenizeSentence(line));
    }

    /***************************************************************
     * (4) ‘재조합’ 로직
     ***************************************************************/
    // 간단히 “토큰들을 랜덤 순서로 섞어서” 문장을 만든다
    // (원본 그대로를 쓰고 싶으면 이 로직을 생략 or line.join(" ")로 반환)
    function combineTokensRandomly(tokenArray) {
      // tokenArray: ["정말로", "슬퍼", "...", "😢", "눈물이", "절로", "나네요."]
      // => Fisher-Yates shuffle
      for (let i = tokenArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tokenArray[i], tokenArray[j]] = [tokenArray[j], tokenArray[i]];
      }
      // 예시로, 공백으로 join
      return tokenArray.join(" ");
    }

    /***************************************************************
     * (5) 감정 응답 문장 생성 시, 토큰화된 결과를 재조합
     ***************************************************************/
    function getEmotionResponse(emotion) {
      // emotionResponsesTokens[emotion] 에서 랜덤 한 줄 선택
      const tokenArrays = emotionResponsesTokens[emotion];
      if (!tokenArrays || tokenArrays.length === 0) return "";

      const pick = tokenArrays[Math.floor(Math.random() * tokenArrays.length)];
      // pick: ["정말로", "슬퍼", "...", "😢", "눈물이", "절로", "나네요."]

      // (A) 만약 “원본”만 쓰고 싶으면: return pick.join(" ");
      // (B) 랜덤으로 토큰 순서를 섞어서 재조합
      return combineTokensRandomly([...pick]);  // 사본을 전달
    }
  </script>

  <script>
    /***************************************************************
     * (기존 코드는 대부분 유지) 
     ***************************************************************/
    // (이하: 캘린더, 지도, 날씨, 캐릭터 3D 설정 등은 기존 그대로)
    // regionMap, regionList, weatherKey, etc...

    async function sendChat() {
      const inputEl = document.getElementById("chat-input");
      const input = inputEl.value.trim();
      if (!input) return;

      let response = "";
      const lowerInput = input.toLowerCase();

      // 지역 변경 등 기존 처리 ...
      // ...

      // 감정 감지
      const detectedEmotions = detectEmotion(input);
      if (detectedEmotions.length > 0) {
        // 첫 번째 감정에 대한 토큰화-재조합된 문장 사용
        const emotion = detectedEmotions[0];
        response = getEmotionResponse(emotion);
      }

      // 감정 없을 때는 기존 로직 ...
      if (!response) {
        // (기존 if-else 등 ...)
        response = "죄송합니다. 잘 이해하지 못했습니다. 다시 말씀해주시겠어요?";
      }

      showSpeechBubbleInChunks(response);
      inputEl.value = "";
    }

    // ... 이하: 기존 함수들 (initCalendar, getWeather, showTutorial 등) 그대로
  </script>
</head>
<body>
  <!-- (기존 body 구조 동일) -->
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
  
  <div id="hud-3">
    <iframe id="map-iframe" src="https://www.google.com/maps?q=Seoul&output=embed" frameborder="0"
            style="width:100%; height:100%; border:0;" allowfullscreen></iframe>
  </div>
  
  <div id="left-hud">
    <h3>캘린더</h3>
    <div id="calendar-container">
      <!-- (기존 내용) -->
    </div>
  </div>
  
  <div id="speech-bubble"></div>
  
  <div id="tutorial-overlay">
    <div id="tutorial-content">
      <h2>사용법 안내</h2>
      <p><strong>캐릭터:</strong> 채팅창에 "안녕", "캐릭터 춤춰줘" 등 입력해 보세요.</p>
      <p>
        <strong>채팅창:</strong> 상단 드롭다운 메뉴에서 지역을 선택하면 지도와 날씨가 즉시 업데이트됩니다.
        "지역 [지역명]" (예: "지역 인천") 입력도 가능.<br>
        "날씨 알려줘"로 현재 지역의 날씨를 다시 확인할 수 있습니다.<br>
        "일정 삭제", "하루일정 삭제" 입력으로 캘린더 일정을 삭제할 수 있습니다.<br>
        "일정 알려줘"로 저장된 일정을 확인할 수 있습니다 (예: "2025-4-15 일정 알려줘").
      </p>
      <p><strong>캘린더:</strong> 왼쪽에서 날짜 클릭해 일정을 추가하거나, 버튼으로 저장/삭제하세요.</p>
      <p><strong>버전 선택:</strong> 하단 드롭다운에서 "구버전 1.3" 또는 "최신 버전 (1.7)"을 선택해 페이지 이동.</p>
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
    /***************************************************************
     * (이하: 3D 캐릭터, animate(), initCalendar(), showTutorial() 등
     *  기존 함수 및 로직 동일)
     ***************************************************************/
    // 예: scene, camera, renderer 설정, etc...

    // ... (이전과 동일한 내용)
  </script>
</body>
</html>
