const { getWindGuruData } = require("./windguruScraper");

const axios = require("axios");
const fs = require("fs");
const path = require("path");

/* ---------------------------- ENV VARS ---------------------------- */
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const TO_NUMBER = process.env.DESTINATION;

const STATE_FILE = "./state.json";

/* ---------------------------- REFRANES ---------------------------- */
function loadRefranes() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, "refranes.txt"), "utf8");
    return raw
      .split("\n")
      .map(r => r.trim())
      .filter(r => r.length > 0);
  } catch (err) {
    console.error("❌ No se pudo cargar refranes:", err.message);
    return ["Más vale prevenir que curar."]; // fallback seguro
  }
}

function getRefranRandom() {
  const refranes = loadRefranes();
  return refranes[Math.floor(Math.random() * refranes.length)];
}

/* ---------------------------- ESTADO ---------------------------- */
function getState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { last_alert_hash: null };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

/* ---------------------------- WHATSAPP ---------------------------- */
async function sendMessage(text) {
  try {
    console.log("\n================ WHATSAPP MESSAGE SENT ================");
    console.log(text);
    console.log("=======================================================\n");

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
    console.error("❌ Error enviando WhatsApp:", err.response?.data || err.message);
  }
}

/* ---------------------------- WINDGURU (SCRAPER) ---------------------------- */
async function getWindGuruAlerts() {
  try {
    const data = await getWindGuruData(139);
    if (!data) return { error: "No se pudo parsear WindGuru" };

    const { rain, hours, temp } = data;
    const alerts = [];
    const today = new Date().getDate();

    for (let i = 0; i < hours.length; i++) {
      const hour = new Date(hours[i]);
      if (hour.getDate() !== today) continue;

      const mm = rain[i];
      if (mm > 0) {
        alerts.push({
          time: hour.toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit"
          }),
          desc: `lluvia (${mm} mm/h)`,
          temp: temp[i] || null,
          dt: hours[i]
        });
      }
    }

    return alerts;
  } catch (err) {
    return { error: err.message };
  }
}

/* ---------------------------- MAIN ---------------------------- */
async function checkWeather() {
  try {
    const state = getState();

    const alerts = await getWindGuruAlerts();

    if (alerts.error) {
      await sendMessage(`❌ Pauli, WindGuru no respondió:\n${alerts.error}`);
      return;
    }

    if (alerts.length === 0) {
      console.log("No hay lluvia según WindGuru.");
      return;
    }

    const first = alerts[0];
    const alertHash = `${first.dt}-${first.desc}-${Math.round(first.temp || 0)}`;

    if (state.last_alert_hash === alertHash) {
      console.log("⛔ Alerta duplicada, no se envía.");
      return;
    }

    let msg = `🌤️ Hola Pauli!\n"${getRefranRandom()}"\n\n`;
    msg += `⛈️ Alerta de lluvia según WindGuru (alta precisión)\n\n`;

    for (const a of alerts) {
      msg += `• ${a.time} → ${a.desc}`;
      if (a.temp) msg += ` (${a.temp}°C)`;
      msg += `\n`;
    }

    await sendMessage(msg);
    saveState({ last_alert_hash: alertHash });

  } catch (err) {
    await sendMessage(`❌ Error inesperado:\n${err.message}`);
  }
}

checkWeather();
