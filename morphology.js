// morphology.js

// 백엔드 API 기본 URL (main.js와 동일)
const API_BASE_URL = 'https://emotionail2-0.onrender.com';

// TensorFlow.js를 사용하기 위한 모듈 (설치 필요: npm install @tensorflow/tfjs)
const tf = require('@tensorflow/tfjs-node');

// 딥러닝 모델 관련 설정
let morphologyModel = null;
const MODEL_URL = 'https://https://www.emotionail.site//model.json'; // 실제 사전 학습된 모델 URL로 대체

/**
 * 딥러닝 형태소 분석 모델을 로드합니다.
 * @returns {Promise<void>}
 */
async function loadMorphologyModel() {
    try {
        morphologyModel = await tf.loadLayersModel(MODEL_URL);
        console.log("딥러닝 형태소 분석 모델이 성공적으로 로드되었습니다.");
    } catch (error) {
        console.error("모델 로드 실패:", error);
        morphologyModel = null; // 로드 실패 시 null로 설정
    }
}

/**
 * 텍스트를 정규화합니다. 불필요한 공백과 특수 문자를 제거합니다.
 * @param {string} text - 정규화할 텍스트
 * @returns {string} 정규화된 텍스트
 */
function normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    text = text.replace(/\s+/g, ' ').trim(); // 연속 공백을 단일 공백으로, 양쪽 공백 제거
    text = text.replace(/[^\w\s가-힣]/g, ''); // 특수 문자 제거, 한국어와 기본 문자만 유지
    return text;
}

/**
 * 한국어 동사의 기본형을 추출합니다. 규칙 기반으로 동작하며, 향후 모델로 대체 가능.
 * @param {string} word - 어간 추출 대상 단어
 * @returns {string} 어간으로 변환된 단어
 */
function stemWord(word) {
    if (!word || typeof word !== 'string') return word;
    if (word.endsWith('다')) return word;
    const patterns = [
        { regex: /었다$/, replace: '다' },  // '먹었다' -> '먹다'
        { regex: /았다$/, replace: '다' },  // '갔다' -> '가다'
        { regex: /했다$/, replace: '하다' }, // '했다' -> '하다'
    ];
    for (const pattern of patterns) {
        if (pattern.regex.test(word)) {
            return word.replace(pattern.regex, pattern.replace);
        }
    }
    return word;
}

/**
 * 단어를 표제어로 변환합니다. 딥러닝 모델 결과를 활용할 수 있도록 설계.
 * @param {string} word - 표제어로 변환할 단어
 * @param {string} [pos] - 선택적 품사 태그
 * @returns {string} 단어의 표제어
 */
function lemmatizeWord(word, pos) {
    // TODO: 딥러닝 모델 기반 표제어 변환 로직 추가 가능
    return word; // 현재는 placeholder로 입력값 반환
}

/**
 * 딥러닝 모델을 사용하여 형태소 분석을 수행합니다.
 * @param {string} text - 분석할 텍스트
 * @returns {Promise<Array<{word: string, pos: string}>>} 형태소 분석 결과
 */
async function analyzeMorphologyWithModel(text) {
    if (!morphologyModel) {
        throw new Error("딥러닝 모델이 로드되지 않았습니다.");
    }

    // 1. 텍스트를 토큰화 및 모델 입력 형식으로 변환
    const normalizedText = normalizeText(text);
    const tokens = normalizedText.split(' '); // 간단한 공백 기반 토큰화 (실제로는 모델 요구사항에 맞게 조정 필요)
    const inputTensor = tf.tensor([tokens]); // 모델 입력 텐서 생성 (예시)

    // 2. 모델 예측 수행
    const prediction = await morphologyModel.predict(inputTensor).dataSync();
    
    // 3. 예측 결과를 형태소 분석 형식으로 변환
    // (모델 출력이 단어와 품사 태그 쌍으로 반환된다고 가정)
    const result = tokens.map((token, index) => {
        const pos = prediction[index] || 'N/A'; // 모델 출력에서 품사 추출 (구체적인 인덱스는 모델 구조에 따라 다름)
        return { word: token, pos };
    });

    return result;
}

/**
 * 백엔드 API를 호출하여 형태소 분석 결과를 받아옵니다 (Fallback).
 * @param {string} text - 분석할 텍스트
 * @returns {Promise<Array<{word: string, pos: string}>>} 형태소 분석 결과
 */
async function analyzeMorphologyWithAPI(text) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/morph`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
        const { analyzed } = await response.json();
        return (analyzed || []).map(item => {
            const [word, pos] = item.split('/');
            return { word, pos: pos || 'N/A' };
        });
    } catch (error) {
        console.error("형태소 분석 API 호출 실패:", error);
        return [];
    }
}

/**
 * 형태소 분석을 수행합니다. 모델 우선, 실패 시 API 사용.
 * @param {string} text - 분석할 텍스트
 * @returns {Promise<Array<{word: string, pos: string}>>} 형태소 분석 결과
 */
async function analyzeMorphology(text) {
    if (!text || typeof text !== 'string') return [];

    if (morphologyModel) {
        try {
            return await analyzeMorphologyWithModel(text);
        } catch (error) {
            console.warn("딥러닝 모델 분석 실패, API로 전환:", error);
        }
    }
    return await analyzeMorphologyWithAPI(text);
}

/**
 * 형태소 분석 결과를 UI에 표시할 수 있는 형식으로 가공합니다.
 * @param {Array<{word: string, pos: string}>} result - 형태소 분석 결과 배열
 * @returns {string} 가공된 결과 문자열
 */
function formatMorphologyResult(result) {
    if (!Array.isArray(result) || result.length === 0) return '분석 결과가 없습니다.';
    return result.map(({ word, pos }) => `${word}(${pos})`).join(' ');
}

// 모델 초기 로드
loadMorphologyModel();

// 모듈 내보내기
module.exports = {
    normalizeText,
    stemWord,
    lemmatizeWord,
    analyzeMorphology,
    formatMorphologyResult
};
