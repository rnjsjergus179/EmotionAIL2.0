// intent.js

// TensorFlow.js 라이브러리를 사용하기 위해 HTML에 추가 필요:
// <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"></script>

// 의도 분류를 위한 TensorFlow.js 모델 변수
let intentModel;

// 사전 학습된 의도 분류 모델을 로드하는 함수
async function loadIntentModel() {
  try {
    // 실제 모델 URL로 교체 필요 (예: 'https://your-model-url.com/model.json')
    intentModel = await tf.loadLayersModel('https://your-model-url.com/model.json');
    console.log("의도 분류 모델이 성공적으로 로드되었습니다.");
  } catch (error) {
    console.error("의도 분류 모델 로드 실패:", error);
  }
}

// 사용자의 입력 텍스트를 기반으로 의도를 분류하는 함수
async function classifyIntent(inputText) {
  // 입력 텍스트를 임베딩으로 변환 (main.js에서 제공된다고 가정)
  const inputEmbedding = await getEmbedding(inputText);

  // 모델이 로드되었는지 확인
  if (intentModel) {
    // 입력 데이터를 텐서로 변환
    const inputTensor = tf.tensor([inputEmbedding]);

    // 모델을 사용해 의도 예측
    const prediction = intentModel.predict(inputTensor);
    const probabilitiesArray = prediction.dataSync();

    // 의도 목록과 확률 매핑 (KEYWORDS는 main.js에서 정의되었다고 가정)
    const intents = Object.keys(KEYWORDS);
    const probabilities = {};
    let maxProb = 0;
    let detectedIntent = 'unknown';

    // 가장 높은 확률의 의도 찾기
    probabilitiesArray.forEach((prob, index) => {
      probabilities[intents[index]] = prob;
      if (prob > maxProb) {
        maxProb = prob;
        detectedIntent = intents[index];
      }
    });

    // 결과 반환
    return { 
      intent: detectedIntent, 
      probabilities: probabilities, 
      embedding: inputEmbedding 
    };
  } else {
    console.warn("의도 분류 모델이 로드되지 않았습니다. 'unknown' 의도를 반환합니다.");
    return { 
      intent: 'unknown', 
      probabilities: {}, 
      embedding: inputEmbedding 
    };
  }
}

// 모델 로드 실행 (페이지 로드 시 main.js에서 호출된다고 가정)
loadIntentModel();
