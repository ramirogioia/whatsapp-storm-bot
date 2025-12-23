// windguruScraper.js
const axios = require("axios");
const cheerio = require("cheerio");

/*
  Scrapea la página WindGuru del spot 139 (Buenos Aires)
  y devuelve lluvia por hora, temperatura y hora local.
*/
async function getWindGuruData(spotId = 139) {
  try {
    const url = `https://www.windguru.cz/${spotId}`;
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36"
      }
    });

    const $ = cheerio.load(data);

    const result = {
      rain: [],
      hours: [],
      temp: []
    };

    // Busca las tablas del pronóstico (rain, temp, hour)
    const forecastTables = $("table").filter((i, el) => {
      const html = $(el).html() || "";
      return html.includes("RAIN") || html.includes("TMP") || html.includes("HOUR");
    });

    // WindGuru usa columnas por fila
    forecastTables.each((i, table) => {
      const rows = $(table).find("tr");

      rows.each((r, row) => {
        const title = $(row).find("td:first").text().trim().toUpperCase();
        const values = [];

        $(row)
          .find("td")
          .each((ci, cell) => {
            if (ci === 0) return;
            values.push($(cell).text().trim());
          });

        if (title.includes("RAIN")) {
          result.rain = values.map(v => Number(v) || 0);
        }

        if (title.includes("TMP") || title.includes("TEMP")) {
          result.temp = values.map(v => Number(v) || null);
        }

        if (title.includes("HOUR")) {
          result.hours = values.map(hourStr => {
            // Formato: "13:00", "17:00"
            const now = new Date();
            const [h, m] = hourStr.split(":").map(Number);
            const dt = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              h,
              m
            );
            return dt.toISOString();
          });
        }
      });
    });

    return result;
  } catch (err) {
    console.error("❌ Error scraping WindGuru:", err.message);
    return null;
  }
}

module.exports = { getWindGuruData };
