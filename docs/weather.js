import { getWeather as apiGetWeather } from './api.js';
import { regionMap } from './config.js';

export async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        resolve(position.coords);
      }, error => {
        reject(error);
      });
    } else {
      reject("Geolocation is not supported by this browser.");
    }
  });
}

export async function getWeather(currentCity) {
  try {
    const position = await getUserLocation();
    const { latitude, longitude } = position;
    const data = await apiGetWeather(latitude, longitude);
    const message = `현재 위치의 날씨는 ${data.description}이고, 기온은 ${data.temperature}°C입니다.`;
    return { message, currentWeather: data.description };
  } catch (error) {
    console.error("위치 기반 날씨 가져오기 실패:", error);
    const englishCity = regionMap[currentCity] || "Seoul";
    const data = await apiGetWeather(null, null, englishCity);
    if (data) {
      const message = `오늘 ${currentCity}의 날씨는 ${data.description}이고, 기온은 ${data.temperature}°C입니다.`;
      return { message, currentWeather: data.description };
    } else {
      return { message: "날씨 정보를 가져오는데 실패했습니다.", currentWeather: "" };
    }
  }
}
