const axios = require("axios");
const fs = require("fs");

const API_KEY = process.env.OPENWEATHER_KEY;
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const TO_NUMBER = process.env.DESTINATION;

const LAT = -34.7016;
const LON = -58.4100;

const STATE_FILE = "./state.json";

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
  "Al que quiere celeste, que le cueste.",
  "A palabras necias, oídos sordos.",
  "Ojos que no ven, corazón que no siente.",
  "Quien mal anda, mal acaba.",
  "Barriga llena, corazón contento.",
  "Haz el bien sin mirar a quién.",
  "Perro que ladra no muerde.",
  "Donde hubo fuego, cenizas quedan.",
  "A caballo regalado no se le mira el diente.",
  "Roma no se hizo en un día.",
  "No hay peor ciego que el que no quiere ver.",
  "Cada loco con su tema.",
  "A grandes males, grandes remedios.",
  "Más vale tarde que nunca.",
  "El hábito no hace al monje.",
  "Al mal paso, darle prisa.",
  "En boca cerrada no entran moscas.",
  "El que no arriesga no gana.",
  "Lo prometido es deuda.",
  "Más sabe el diablo por viejo que por diablo.",
  "Un clavo saca a otro clavo.",
  "Piensa mal y acertarás.",
  "A río revuelto, ganancia de pescadores.",
  "Hombre prevenido vale por dos.",
  "Hierba mala nunca muere.",
  "La esperanza es lo último que se pierde.",
  "Donde manda capitán, no manda marinero.",
  "A falta de pan, buenas son tortas.",
  "Zorro viejo no cae en la trampa.",
  "Nunca es tarde si la dicha es buena.",
  "Quien mucho se despide, pocas ganas tiene de irse.",
  "El que calla otorga.",
  "Quien siembra vientos recoge tempestades.",
  "No por mucho madrugar amanece más temprano.",
  "Cada oveja con su pareja.",
  "Al pan, pan y al vino, vino.",
  "Cuando el gato no está, los ratones bailan.",
  "No se puede estar en misa y en la procesión.",
  "Vísteme despacio que estoy apurado.",
  "Arrieros somos y en el camino andamos.",
  "El que algo quiere, algo le cuesta.",
  "No hay mal que cien años dure.",
  "Al que buen árbol se arrima, buena sombra lo cobija.",
  "El tiempo lo cura todo.",
  "Cuando el hambre aprieta, no hay pan duro.",
  "No es oro todo lo que reluce.",
  "De tal palo, tal astilla.",
  "Genio y figura hasta la sepultura.",
  "Con paciencia y saliva, el elefante a la hormiga.",
  "Dios aprieta pero no ahorca.",
  "El que avisa no traiciona.",
  "A llorar al campito.",
  "A buen entendedor, pocas palabras.",
  "Del dicho al hecho hay mucho trecho.",
  "No hay rosa sin espinas.",
  "El que nace para pito, nunca llega a corneta.",
  "El que se quema con leche, ve una vaca y llora.",
  "Lo barato sale caro.",
  "Quien mucho corre, pronto para.",
  "Nunca llueve a gusto de todos.",
  "Mañana será otro día.",
  "A todo cerdo le llega su San Martín.",
  "En la variedad está el gusto.",
  "La ocasión hace al ladrón.",
  "El que espera, desespera.",
  "Nadie es profeta en su tierra.",
  "Hoy por ti, mañana por mí.",
  "Más vale pájaro en mano que cien volando.",
  "Cada maestrito con su librito.",
  "La suerte está echada.",
  "Donde pisa león, no pisa burro.",
  "Si la montaña no viene a ti, ve tú a la montaña.",
  "Al que no quiere caldo, se le dan dos tazas."
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

function getRefranRandom() {
  return REFRANES[Math.floor(Math.random() * REFRANES.length)];
}

/* -------------------------- WHATSAPP --------------------------- */
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
    console.error(
      "Error enviando WhatsApp:",
      err.response?.data || err.message
    );
  }
}

/* --------------------------- UTILS ----------------------------- */
function formatHour(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

/* ----------------------- CHECK WEATHER ------------------------- */
async function checkWeather() {
  try {
    const state = getState();

    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=es`;
    const { data } = await axios.get(url);

    const refran = getRefranRandom();
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
      const first = alerts[0];
      const alertHash = `${first.desc}-${first.dt}-${Math.round(first.temp)}`;

      if (state.last_alert_hash === alertHash) {
        console.log("⛔ Alerta duplicada, no se envía.");
        return;
      }

      let message = `🌤️ Hola Pauli!\n"${refran}"\n\n`;
      message += `⛈️ Alerta de lluvia para hoy en Lanús Oeste\n\n`;

      for (const a of alerts) {
        message += `• ${a.time} → ${a.desc} (${a.temp}°C)\n`;
      }

      await sendMessage(message);
      saveState({ last_alert_hash: alertHash });

    } else {
      console.log("No hay alertas de lluvia.");
    }

  } catch (err) {
    await sendMessage(
      `❌ Pauli, tuve un error revisando el clima:\n${JSON.stringify(
        err.response?.data || err.message
      )}`
    );
  }
}

checkWeather();
