import { updateData } from "./spreadsheet.js";
import cron from "node-cron";

let wa_text = await wa_text_generate();

async function wa_text_generate(){
    const data = await updateData();
    const date = new Date();
    const month = date.getMonth() + 1;
    const year = date.getFullYear().toString().slice(2, 4);

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

async function wa_text_update(){
    wa_text = await wa_text_generate();
    cron.schedule('0-59/10 * * * *', async () => {
        wa_text = await wa_text_generate();
        let date = new Date()
        console.log("Data updated at: " + date.getHours() + ":" + date.getMinutes());
    });
}

export {wa_text, wa_text_update};