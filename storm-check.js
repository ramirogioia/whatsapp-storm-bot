const axios = require("axios");
const fs = require("fs");

const API_KEY = process.env.OPENWEATHER_KEY;
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const TO_NUMBER = process.env.DESTINATION;

const LAT = -34.7016;
const LON = -58.4100;

const STATE_FILE = "./state.json";

// ------------------------
// Leer estado previo
// ------------------------
function getState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { last_alert_hash: null };
  }
}

// ------------------------
// Guardar estado
// ------------------------
function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ------------------------
async function getRefranRandom() {
  try {
    const res = await axios.get(
      "https://raw.githubusercontent.com/joseangelmt/refranes-espanoles/master/refranes.json"
    );
    const refranes = res.data;
    return refranes[Math.floor(Math.random() * refranes.length)];
  } catch {
    return "Más vale prevenir que curar.";
  }
}

async function sendMessage(text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: TO_NUMBER,
        text: { body: text }
      },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
  } catch (err) {
    console.error("Error enviando WhatsApp:", err.response?.data || err.message);
  }
}

function formatHour(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

async function checkWeather() {
  try {
    const state = getState();

    // Forecast
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
          temp: entry.main.temp,
          dt: entry.dt_txt
        });
      }
    }

    if (alerts.length > 0) {
      // Sacamos el PRIMER evento del día como referencia
      const first = alerts[0];

      // Hash único del evento
      const alertHash = `${first.desc}-${first.dt}-${Math.round(first.temp)}`;

      // Si es igual al anterior → no enviar
      if (state.last_alert_hash === alertHash) {
        console.log("⛔ Alerta repetida, no se envía.");
        return;
      }

      // Si es nueva → enviar
      let message = `🌤️ Hola Pauli!\n"${frase}"\n\n`;
      message += `⛈️ Alerta de lluvia para hoy en Lanús Oeste\n\n`;

      for (const a of alerts) {
        message += `• ${a.time} → ${a.desc} (${a.temp}°C)\n`;
      }

      await sendMessage(message);

      // Guardar nuevo estado
      saveState({ last_alert_hash: alertHash });

    } else {
      console.log("Sin lluvia significativa hoy.");
    }

  } catch (err) {
    console.error("Error consultando clima:", err.response?.data || err.message);
    await sendMessage(`❌ Pauli, tuve un error mirando el clima:\n${JSON.stringify(err.response?.data || err.message)}`);
  }
}

checkWeather();
