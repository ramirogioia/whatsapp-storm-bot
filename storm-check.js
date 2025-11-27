const axios = require("axios");

const API_KEY = process.env.OPENWEATHER_KEY;
const CITY = "Buenos Aires,AR"; // Cambiar si querés otra ciudad
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const TO_NUMBER = process.env.DESTINATION;

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
    console.error("Error enviando mensaje:", err.response?.data || err.message);
  }
}

async function checkStorm() {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${API_KEY}&lang=es`;
    const { data } = await axios.get(url);

    const today = new Date().getDate();
    const storms = data.list.filter(entry => {
      const entryDay = new Date(entry.dt * 1000).getDate();
      return (
        entryDay === today &&
        entry.weather.some(w => w.main === "Thunderstorm")
      );
    });

    if (storms.length > 0) {
      await sendMessage("⚠️ *Alerta climática*: Se pronostica tormenta para hoy.");
    }
  } catch (err) {
    console.error("Error consultando clima:", err.response?.data || err.message);
  }
}

checkStorm();
