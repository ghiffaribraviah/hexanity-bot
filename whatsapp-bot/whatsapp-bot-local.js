import { wa_text, wa_text_update } from "../spreadsheet/text-local.js";
import 'dotenv/config';
import wapkg from 'whatsapp-web.js';
import qrcode from 'qrcode';
import cron from 'node-cron';
const { Client, LocalAuth } = wapkg;

async function dailyReminder(){
    cron.schedule('0 */2 * * *', async() => {
        const number = process.env.TARGET_NUMBER_ID;
        const chatId = number.includes('@g.us') ? number : number.replace('+', '') + '@c.us';
        client.sendMessage(chatId, wa_text);
     });

}

const puppeteerOptions = {
     headless: true,
     args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
     ],
     executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
 };

let isReady = false;

const client = new Client({
        puppeteer: puppeteerOptions,
        authStrategy: new LocalAuth({
            dataPath: "wa_data"
        })
    });

client.on("qr", async (qr) => {
    console.log("⚡ QR recieved, generating image...");
    await qrcode.toFile('qr.png', qr);
    console.log('QR saved as qr.png');
});

client.on('authenticated', (session) => {
    console.log('✅ AUTHENTICATED');
});

client.on('auth_failure', (msg) => {
    console.error('❌ AUTHENTICATION FAILURE', msg);
});

client.on('disconnected', (reason) => {
    console.log('❌ Client was disconnected', reason);
});

client.once("ready", () => {
    isReady = true;
    console.log("✅ Client is ready!");
    dailyReminder();
});

client.on('message_create', message => {
    if(message.body === "!RekapSekre"){
        console.log("Requested Rekap from: " + message.from)
        client.sendMessage(message.from, wa_text);
    }
});

wa_text_update();


client.initialize();