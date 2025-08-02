import { GoogleSpreadsheet } from "google-spreadsheet";
import {JWT} from "google-auth-library";
import 'dotenv/config';
import cron from "node-cron";

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_CLIENT_EMAIL,
    key: process.env.GOOGLE_SERVICE_PRIVATE_KEY.split(String.raw`\n`).join('\n'),
    scopes: SCOPES,
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_URL, serviceAccountAuth);
await doc.loadInfo();

const sheet = doc.sheetsByTitle['Rekap Tugas Semester 5'];
await sheet.loadHeaderRow(3);

let rekap_data = {
    one_day:[],
    deket_dl:[],
    nyantai:[]
};

async function updateData(){
    const currentRows = await sheet.getRows();
    
    rekap_data["one_day"] = [];
    rekap_data["deket_dl"] = [];
    rekap_data["nyantai"] = [];

    for(let i = 0; i < currentRows.length; i++){
        if(currentRows[i].get('Tanggal DL') === undefined || currentRows[i].get('Tanggal DL') === "#N/A"){
            break;
        }

        const sub = [];
        sub.push(currentRows[i].get('Status'));
        sub.push(currentRows[i].get('Kode Kelas'));
        sub.push(currentRows[i].get('Judul Tugas'));
        
        if(sub[0].slice(0, 2) == "Lewat DL"){
            continue;
        }

        else if(sub[0].slice(0, 3) == "H-1" || sub[0].slice(0, 3) == "H-2" || sub[0].slice(0, 3) == "H-3"){
            rekap_data["deket_dl"].push(sub);
        }

        else if(sub[0].slice(0, 2) == "H-"){
            rekap_data["nyantai"].push(sub);
        }

        else{
            rekap_data["one_day"].push(sub);
        }
        
    }

    const update_date = new Date()
    console.log("Data updated at:\n" + update_date.getDate() + "/" 
    + (update_date.getMonth() + 1) + "/" + update_date.getFullYear() + "\n"
    + update_date.getHours() + ":" + update_date.getMinutes() + "\n");
};

async function startUpdate(){
    cron.schedule('*/10 * * * *', async () => {
        await updateData();
        console.log("Data updated!");
    });
}

async function getData(){
    await updateData();
    return rekap_data;
}

export {startUpdate, getData};