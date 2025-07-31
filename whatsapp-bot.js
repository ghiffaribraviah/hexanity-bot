import { updateData } from "./spreadsheet.js";
import 'dotenv/config';
import wapkg from 'whatsapp-web.js';
import qrpkg from 'qrcode-terminal';
import { MongoStore } from "wwebjs-mongo";
import mongoosepkg from "mongoose";

function textRekap(){
    const data = updateData();
    const date = new Date();
    const year = date.getFullYear().toString().slice(2, 4);

    let text =
    "*#RekapDongSekre*\n" +
    date.getDate() + "/" + date.getMonth() + "/" + year + "\n\n" +
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
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/hexanity-bot";
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    const store = new MongoStore({ mongoose: mongoose });

    client = new Client({
        authStrategy: new RemoteAuth({
        store: store,
        backupSyncIntervalMs: 300000,
        }),
    });

    client.once("ready", () => {
        isReady = true;
        console.log("✅ Client is ready!");
    });

    client.on("qr", (qr) => {
        console.log("⚡ Scan this QR code:");
        qrcode.generate(qr, { small: true });
    });

    client.on("remote_session_saved", async () => {
        console.log("💾 Remote session saved");
        // Trigger pengiriman pesan otomatis setelah session tersimpan
        try {
            const number = process.env.TARGET_NUMBER_ID || '+6281286714480';
            const chatId = number.replace('+', '') + '@g.us';
            let message = textRekap();
            await client.sendMessage(chatId, message);
            console.log(`Message sent to ${number}`);
        } catch (err) {
            console.error('Gagal kirim pesan otomatis:', err.message);
        }
    });

    client.on('message_create', message => {
        if(message.body === "!RekapSekre"){
            client.sendMessage(message.from, textRekap());
        }
    });

    client.initialize();
};

// Fungsi untuk kirim pesan ke nomor target, dipanggil dari API/cron job
async function sendMessageToTarget() {
    if (!client || !isReady) {
        throw new Error('WhatsApp client not initialized or not ready');
    }
    const number = process.env.TARGET_NUMBER_ID || '+6281286714480';
    const chatId = number.replace('+', '') + '@g.us';
    let message = textRekap();
    await client.sendMessage(chatId, message);
    return `Message sent to ${number}`;
}

export { HexanityBot, sendMessageToTarget };