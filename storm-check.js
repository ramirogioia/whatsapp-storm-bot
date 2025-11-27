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
  "Barriga llena, corazón conte
