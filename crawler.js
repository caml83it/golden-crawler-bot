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

async function crawlDuyMong() {
    try {
        const { data } = await axios.get("https://giavangduymong.com/");
        const $ = cheerio.load(data);
        let result = null;

        $(".goldbox-table tbody tr").each((i, el) => {
            const text = $(el).text();
            if (text.includes("99.99") || text.includes("9999")) {
                const cols = $(el)
                    .find("td")
                    .map((i, el) => $(el).text().trim())
                    .get();

                if (!result && cols.length >= 3) {
                    result = {
                        buy: cols[1],
                        sell: cols[2],
                    };
                }
            }
        });
        return result;
    } catch (e) {
        console.error("Lỗi khi cào giá Duy Mong:", e.message);
        return null;
    }
}

async function main() {
    const kkvhGold = await crawlGold();
    const duyMongGold = await crawlDuyMong();

    let message = `⏰ ${new Date().toLocaleString()}\n`;

    if (kkvhGold) {
        message += `
💰 Giá vàng 9999 Kim Khánh Việt Hùng

Mua vào: ${kkvhGold.buy}
Bán ra: ${kkvhGold.sell}
`;
    }

    if (duyMongGold) {
        message += `
💰 Giá vàng 9999 Duy Mong

Mua vào: ${duyMongGold.buy}
Bán ra: ${duyMongGold.sell}
`;
    }

    if (kkvhGold || duyMongGold) {
        await sendTelegram(message);
    }
}

main();