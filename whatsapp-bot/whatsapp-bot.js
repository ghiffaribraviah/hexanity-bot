import { getData } from "../spreadsheet/spreadsheet.js";
import 'dotenv/config';
import wapkg from 'whatsapp-web.js';
import qrpkg from 'qrcode-terminal';
import { MongoStore } from "wwebjs-mongo";
import mongoosepkg from "mongoose";

function textRekap(){
    const data = getData();
    const date = new Date();
    const month = date.getMonth() + 1;
    const year = date.getFullYear().toString().slice(2, 4);
    console.log("Waktu hari ini: " + date.getDate() + " " + month + " " + year);

    let text =
    "*#RekapDongSekre*\n" +
    date.getDate() + "/" + month + "/" + year + "\n\n" +
    "*In 24 Hours Alert 🔥*\n";

    for(let i = 0; i < data["one_day"].length; i++){
        text = text + "- " + "[" + data["one_day"][i][0] + "] " 
        + data["one_day"][i][1] + " - " 
        + data["one_day"][i][2] + "\n";
    }

    text = text + "\n" + "*Deket Deadline 🕛*\n";
    for(let i = 0; i < data["deket_dl"].length; i++){
        text = text + "- " + "[" + data["deket_dl"][i][0] + "] " 
        + data["deket_dl"][i][1] + " - " 
        + data["deket_dl"][i][2] + "\n";
    }

    text = text + "\n" + "*Nyantai Dulu 😴*\n";
    for(let i = 0; i < data["nyantai"].length; i++){
        text = text + "- " + "[" + data["nyantai"][i][0] + "] " 
        + data["nyantai"][i][1] + " - " 
        + data["nyantai"][i][2] + "\n";
    }

    text = text + "\n" +
    "Cek di sini 👇\n" +
    process.env.MAIN_URL;

    return text;
}

const { Client, RemoteAuth } = wapkg;
const qrcode = qrpkg;
const mongoose = mongoosepkg;

let client;
let isReady = false;
const HexanityBot = async () => {
    try {
        const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/hexanity-bot";
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const store = new MongoStore({ mongoose: mongoose });

        // Konfigurasi Puppeteer yang lebih lengkap untuk Render.com
        const puppeteerOptions = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        };

        // Gunakan RemoteAuth dengan konfigurasi yang lebih baik
        client = new Client({
            puppeteer: puppeteerOptions,
            authStrategy: new RemoteAuth({
                store: store,
                backupSyncIntervalMs: 300000,
                dataPath: process.env.WA_DATA_PATH || './wa-data',
            }),
            restartOnAuthFail: true,
            qrMaxRetries: 5,
        });

        client.on("qr", (qr) => {
            console.log("⚡ Scan this QR code:");
            qrcode.generate(qr, { small: true });
        });

        client.on("remote_session_saved", async () => {
            console.log("💾 Remote session saved");
            try {
                const number = process.env.TARGET_NUMBER_ID;
                // Perbaikan format chatId untuk grup atau personal chat
                const chatId = number.includes('@g.us') ? number : number.replace('+', '') + '@c.us';
                let message = 'Hai, saya kembali hidup!';
                await client.sendMessage(chatId, message);
                console.log(`Message sent to ${number}`);
            } catch (err) {
                console.error('Gagal kirim pesan otomatis:', err.message);
            }
        });
        
        client.on('authenticated', (session) => {
            console.log('✅ AUTHENTICATED');
        });

        client.on('auth_failure', (msg) => {
            console.error('❌ AUTHENTICATION FAILURE', msg);
        });

        client.on('disconnected', (reason) => {
            console.log('❌ Client was disconnected', reason);
            // Coba reconnect setelah disconnect
            setTimeout(() => {
                client.initialize();
            }, 10000);
        });

        client.on('message_create', message => {
            if(message.body === "!RekapSekre"){
                console.log("Requested Rekap from: " + message.from)
                client.sendMessage(message.from, textRekap());
            }
        });

        client.once("ready", () => {
            isReady = true;
            console.log("✅ Client is ready!");
        });

        // Tambahkan delay sebelum inisialisasi client
        setTimeout(() => {
            client.initialize();
        }, 10000);
    } catch (error) {
        console.error('Error initializing WhatsApp bot:', error);
    }
};

// Fungsi untuk kirim pesan ke nomor target, dipanggil dari API/cron job
async function sendMessageToTarget() {
    if (!client || !isReady) {
        throw new Error('WhatsApp client not initialized or not ready');
    }
    try {
        const number = process.env.TARGET_NUMBER_ID;
        // Perbaikan format chatId
        const chatId = number.includes('@g.us') ? number : number.replace('+', '') + '@c.us';
        let message = textRekap();
        await client.sendMessage(chatId, message);
        return `Message sent to ${number}`;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

export { HexanityBot, sendMessageToTarget };