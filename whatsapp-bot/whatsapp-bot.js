import { wa_text, wa_text_update } from "../spreadsheet/text-wa.js";
import 'dotenv/config';
import wapkg from 'whatsapp-web.js';
import qrcode from 'qrcode';
import cron from 'node-cron';
const { Client, LocalAuth } = wapkg;

export async function startWhatsappBot(){
    wa_text_update();

    function humanizeChat(from, text){
        const seenTimer = (Math.floor(Math.random() * 5) + 1) * 1000;
        const typeTimer = (Math.floor(Math.random() * 5) + 5) * 1000 + seenTimer;
        const sendTimer = (Math.floor(Math.random() * 5) + 5) * 1000 + typeTimer;

        setTimeout(async () => {
            const chat = await client.getChatById(from);
            await chat.sendSeen();
        }, seenTimer);
        
        setTimeout(async () => {
            const chat = await client.getChatById(from);
            await chat.sendStateTyping();
        }, typeTimer);

        setTimeout(async () => {
            const chat = await client.getChatById(from);
            await chat.clearState();
        }, sendTimer - 500);

        setTimeout(function(){client.sendMessage(from, text)}, sendTimer);
    }

    async function dailyReminder(){
        console.log("Whatsapp Daily Reminder started!");
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
        console.log('✅ Whatsapp Authenticated');
    });

    client.on('auth_failure', (msg) => {
        console.error('❌ Whatsapp Authentication Failure: ', msg);
    });

    client.on('disconnected', (reason) => {
        console.log('❌ Whatsapp Bot was disconnected: ', reason);
    });

    client.once("ready", () => {
        isReady = true;
        dailyReminder();
        console.log("✅ Whatsapp Bot is ready!");
    });

    client.on('message_create', message => {
        if(message.body === "!RekapSekre"){
            
            console.log("Requested Rekap from: " + message.from);
            humanizeChat(message.from, wa_text);
        }
    });

    client.initialize();
};