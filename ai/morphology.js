const API_BASE_URL = 'https://emotionail2-0.onrender.com';

// 텍스트 전처리 (형태소 분석)
async function processText(text) {
  if (!text || typeof text !== 'string') return "";
  try {
    const response = await fetch(`${API_BASE_URL}/api/morph`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const { analyzed } = await response.json();
    return analyzed ? analyzed.join(' ') : text;
  } catch (error) {
    console.error("형태소 분석 실패:", error);
    return text;
  }
}

export { processText };
