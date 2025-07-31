import { updateData } from "./spreadsheet.js";
import wapkg from 'whatsapp-web.js';
import qrpkg from 'qrcode-terminal';
import 'dotenv/config';

const{ Client, LocalAuth } = wapkg;
const qrcode = qrpkg;

const client = new Client({
    authStrategy: new LocalAuth()
});

client.once('ready', async () => {
    console.log('Client is ready!');
    // Fetch all chats
    const chats = await client.getChats();

    // Filter group chats
    const groups = chats.filter(chat => chat.isGroup);

    // List group names and IDs
    groups.forEach(group => {
        console.log(`Group Name: ${group.name}`);
        console.log(`Group ID: ${group.id._serialized}`);
    });
});

client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
});

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

client.on('message_create', message => {
    if(message.body === "!RekapSekre"){
        client.sendMessage(message.from, textRekap());
    }
});

client.initialize();

// Ini fungsi buat kirim pesan ke nomor target, bisa dipanggil dari API yang dipake buat cron job
async function sendMessageToTarget() {
    const number = process.env.TARGET_NUMBER_ID || '+6281286714480';
    const chatId = number.replace('+', '') + '@g.us';

    let message = textRekap();
    await client.sendMessage(chatId, message);
    return `Message sent to ${number}`;
}

export { client, sendMessageToTarget };