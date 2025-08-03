import { wa_text, wa_text_update } from "../spreadsheet/text-wa.js";
import 'dotenv/config';
import wapkg from 'whatsapp-web.js';
import qrcode from 'qrcode';
import cron from 'node-cron';
const { Client, LocalAuth } = wapkg;

function humanizeChat(from, text){
    const seenTimer = (Math.floor(Math.random() * 5) + 1) * 1000;
    const typeTimer = (Math.floor(Math.random() * 5) + seenTimer + 5) * 1000;
    const sendTimer = (Math.floor(Math.random() * 5) + typeTimer + 5) * 1000;

    setTimeout(function(){client.sendSeen(from)}, seenTimer);
    
    setTimeout(async () => {
        const chat = await client.getChatById(from);
        await chat.sendStateTyping();
    }, typeTimer);

    setTimeout(function(){client.sendMessage(from, text)}, sendTimer);

    setTimeout(async () => {
        const chat = await client.getChatById(from);
        await chat.clearState();
    }, sendTimer + 200);
}

async function dailyReminder(){
    cron.schedule('0 8,20 * * *', async() => {
        const number = process.env.TARGET_NUMBER_ID;
        const chatId = number.includes('@g.us') ? number : number.replace('+', '') + '@c.us';
        humanizeChat(chatId, wa_text);
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
        
        console.log("Requested Rekap from: " + message.from);
        humanizeChat(message.from, wa_text);
    }
});

wa_text_update();


client.initialize();