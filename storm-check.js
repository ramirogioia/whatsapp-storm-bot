const axios = require("axios");

const API_KEY = process.env.OPENWEATHER_KEY;
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const TO_NUMBER = process.env.DESTINATION;

const LAT = -34.7016;
const LON = -58.4100;

async function sendMessage(text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: TO_NUMBER,
        text: { body: text },
      },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
  } catch (err) {
    console.error("Error enviando WhatsApp:", err.response?.data || err.message);
  }
}

function formatTime(ts) {
  return new Date(ts * 1000).toLocaleString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short"
  });
}

async function checkWeather() {
  try {
    // --- Clima actual (posibles ALERTAS OFICIALES SMN) ---
    const nowUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=es`;
    const nowRes = await axios.get(nowUrl);

    if (nowRes.data.alerts) {
      for (const alert of nowRes.data.alerts) {
        const msg = `⚠️ *Alerta Oficial del SMN*\n\n` +
          `*${alert.event}*\n` +
          `Desde: ${formatTime(alert.start)}\n` +
          `Hasta: ${formatTime(alert.end)}\n\n` +
          `${alert.description}`;
        await sendMessage(msg);
      }
    }

    // --- Pronóstico a futuro (lluvia/tormenta próximas) ---
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=es`;
    const forecastRes = await axios.get(forecastUrl);

    const nextHours = forecastRes.data.list.slice(0, 8); // 24hs

    for (const h of nextHours) {
      const w = h.weather[0].main;
      if (w === "Rain" || w === "Thunderstorm") {
        const msg = `⛈️ *Alerta de lluvia/Tormenta próxima*\n\n` +
          `Hora: ${h.dt_txt}\n` +
          `Clima: ${h.weather[0].description}\n` +
          `Temp: ${h.main.temp}°C`;

        await sendMessage(msg);
        break;
      }
    }

  } catch (err) {
    console.error("Error consultando clima:", err.response?.data || err.message);
    await sendMessage(`❌ Error consultando clima:\n${JSON.stringify(err.response?.data || err.message)}`);
  }
}

checkWeather();
