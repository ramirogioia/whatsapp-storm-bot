const axios = require("axios");

const API_KEY = process.env.OPENWEATHER_KEY;
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const TO_NUMBER = process.env.DESTINATION;

const LAT = -34.7016;
const LON = -58.4100;

// -------------------------------------------
// Obtener refrán aleatorio desde GitHub (API gratis)
// -------------------------------------------
async function getRefranRandom() {
  try {
    const res = await axios.get(
      "https://raw.githubusercontent.com/joseangelmt/refranes-espanoles/master/refranes.json"
    );
    const refranes = res.data;
    return refranes[Math.floor(Math.random() * refranes.length)];
  } catch (err) {
    console.error("Error obteniendo refrán:", err.message);
    return "Más vale prevenir que curar."; // fallback
  }
}

// -------------------------------------------
// Enviar mensaje por WhatsApp
// -------------------------------------------
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

// -------------------------------------------
// Formato de hora "09:00 p. m."
// -------------------------------------------
function formatHour(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

// -------------------------------------------
// Chequear clima Lanús Oeste
// -------------------------------------------
async function checkWeather() {
  try {
    // API Forecast gratuita (lluvia/tormenta próximas)
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=es`;

    const { data } = await axios.get(url);

    const frase = await getRefranRandom();
    const today = new Date().getDate();
    const alerts = [];

    for (const entry of data.list) {
      const entryDay = new Date(entry.dt_txt).getDate();
      if (entryDay !== today) continue;

      const cond = entry.weather[0].main;

      if (cond === "Rain" || cond === "Thunderstorm") {
        alerts.push({
          time: formatHour(entry.dt_txt),
          desc: entry.weather[0].description,
          temp: entry.main.temp
        });
      }
    }

    if (alerts.length > 0) {
      let message = `🌤️ Hola Pauli!\n"${frase}"\n\n`;
      message += `⛈️ Alerta de lluvia para hoy en Lanús Oeste\n\n`;

      for (const a of alerts) {
        message += `• ${a.time} → ${a.desc} (${a.temp}°C)\n`;
      }

      await sendMessage(message);
    }

  } catch (err) {
    console.error("Error consultando clima:", err.response?.data || err.message);

    await sendMessage(
      `❌ Pauli, tuve un error mirando el clima:\n${JSON.stringify(
        err.response?.data || err.message
      )}`
    );
  }
}

checkWeather();
