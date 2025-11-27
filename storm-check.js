const axios = require("axios");

// Coordenadas de Lanús Oeste
const LAT = "-34.7016";
const LON = "-58.4100";

const API_KEY = process.env.OPENWEATHER_KEY;
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const TO_NUMBER = process.env.DESTINATION;

// Envía mensaje por WhatsApp
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
    console.error("❌ Error enviando WhatsApp:", err.response?.data || err.message);
  }
}

// Detecta lluvia, tormenta o llovizna
function isRainOrStorm(entry) {
  return entry.weather.some(w =>
    ["Thunderstorm", "Rain", "Drizzle"].includes(w.main)
  );
}

// Chequea el clima cada hora
async function checkStorm() {
  try {
    const url =
      `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=es`;

    const { data } = await axios.get(url);

    const today = new Date().getDate();
    const alerts = [];

    for (const item of data.list) {
      const entryDay = new Date(item.dt * 1000).getDate();

      if (entryDay === today && isRainOrStorm(item)) {
        alerts.push({
          hour: new Date(item.dt * 1000).toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          condition: item.weather[0].description,
          temp: item.main.temp,
        });
      }
    }

    if (alerts.length > 0) {
      let msg = "⛈️ *Alerta de lluvia para hoy en Lanús Oeste*\n\n";

      alerts.forEach(a => {
        msg += `• ${a.hour} → ${a.condition} (${a.temp}°C)\n`;
      });

      await sendMessage(msg);
    }

  } catch (err) {
    // Notificar errores por WhatsApp también
    await sendMessage("❌ Error consultando clima: " + (err.response?.data?.message || err.message));
    console.error("Error:", err.response?.data || err.message);
  }
}

// Ejecutar
checkStorm();
