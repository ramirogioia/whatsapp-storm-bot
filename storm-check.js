const axios = require("axios");
const fs = require("fs");

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const TO_NUMBER = process.env.DESTINATION;

const STATE_FILE = "./state.json";
const WINDGURU_URL = "https://www.windguru.cz/int/json.php?tid=139&uid=0";

/* ------------------------------ 100 REFRANES ----------------------------- */
const REFRANES = [
  "Más vale prevenir que curar.",
  "A quien madruga, Dios le ayuda.",
  "Después de la tormenta siempre llega la calma.",
  "No hay mal que por bien no venga.",
  "Camarón que se duerme, se lo lleva la corriente.",
  "A mal tiempo, buena cara.",
  "Cuando el río suena, agua trae.",
  "Dime con quién andas y te diré quién eres.",
  "No dejes para mañana lo que puedes hacer hoy.",
  "Agua que no has de beber, déjala correr.",
  "El que busca, encuentra.",
  "Cría cuervos y te sacarán los ojos.",
  "No todo lo que brilla es oro.",
  "El que mucho abarca, poco aprieta.",
  "A palabras necias, oídos sordos.",
  "El que calla otorga.",
  "Hierba mala nunca muere."
];

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

/* -------------------------- UTILS --------------------------- */
function getRefranRandom() {
  return REFRANES[Math.floor(Math.random() * REFRANES.length)];
}

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

/* ---------------------- WINDGURU CHECK ----------------------- */
async function getWindGuruAlerts() {
  try {
    const { data } = await axios.get(WINDGURU_URL);
    const model = data.fcst["3"]; // modelo principal WG

    const hours = model.hours;
    const rain = model.rain;
    const temp = model.TMP || model.temp || [];

    const alerts = [];
    const today = new Date().getDate();

    for (let i = 0; i < hours.length; i++) {
      const hour = new Date(hours[i]);
      if (hour.getDate() !== today) continue;

      if (rain[i] > 0) {
        alerts.push({
          time: hour.toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit"
          }),
          desc: `lluvia (${rain[i]} mm/h)`,
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

/* ----------------------- MAIN WEATHER CHECK ------------------------- */
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

    // evitar duplicados
    const first = alerts[0];
    const alertHash = `${first.dt}-${first.desc}-${Math.round(first.temp || 0)}`;

    if (state.last_alert_hash === alertHash) {
      console.log("⛔ Alerta duplicada, no se envía.");
      return;
    }

    // construir mensaje
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
