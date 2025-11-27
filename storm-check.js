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

function formatTime(timestamp) {
  return new Date(timestamp * 1000).toLocaleString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short"
  });
}

async function checkWeather() {
  try {
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=es`;

    const { data } = await axios.get(url);

    // ---------------- ALERTAS OFICIALES -------------------
    if (data.alerts && data.alerts.length > 0) {
      for (const alert of data.alerts) {
        const msg = `⚠️ *Alerta Oficial del SMN*\n\n` +
          `*${alert.event}*\n` +
          `Desde: ${formatTime(alert.start)}\n` +
          `Hasta: ${formatTime(alert.end)}\n\n` +
          `${alert.description}`;

        await sendMessage(msg);
      }
    }

    // ---------------- LLUVIA / TORMENTA -------------------
    const nextHours = data.hourly.slice(0, 12);

    for (const h of nextHours) {
      const weather = h.weather[0]?.main;
      if (weather === "Rain" || weather === "Thunderstorm") {
        const msg = `⛈️ *Alerta de lluvia/tormenta próxima*\n\n` +
          `Hora: ${formatTime(h.dt)}\n` +
          `Clima: ${h.weather[0].description}\n` +
          `Temp: ${h.temp}°C`;

        await sendMessage(msg);
        break;
      }
    }

  } catch (error) {
    console.error("Error consultando clima:", error.response?.data || error.message);
    await sendMessage(`❌ Error consultando clima: ${JSON.stringify(error.response?.data || error.message)}`);
  }
}

checkWeather();
