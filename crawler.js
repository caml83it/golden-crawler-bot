require("dotenv").config();

const axios = require("axios");
const cheerio = require("cheerio");

const URL = "https://kimkhanhviethung.vn/tra-cuu-gia-vang.html";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function crawlGold() {
    const { data } = await axios.get(URL);

    const $ = cheerio.load(data);

    let result = null;

    $("table tr").each((i, el) => {
        const text = $(el).text();

        if (text.includes("999.9")) {
            const cols = $(el)
                .find("td")
                .map((i, el) => $(el).text().trim())
                .get();

            result = {
                buy: cols[1],
                sell: cols[2],
            };
        }
    });

    return result;
}

async function sendTelegram(message) {
    await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
        {
            chat_id: CHAT_ID,
            text: message,
        }
    );
}

async function main() {
    const gold = await crawlGold();

    const message = `
💰 Giá vàng 9999 Kim Khánh Việt Hùng

Mua vào: ${gold.buy}
Bán ra: ${gold.sell}

⏰ ${new Date().toLocaleString()}
`;

    console.log(message);

    await sendTelegram(message);
}

main();