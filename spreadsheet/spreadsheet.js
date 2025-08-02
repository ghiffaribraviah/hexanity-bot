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

const rows = await sheet.getRows();

const rekap_data = {
    one_day:[],
    deket_dl:[],
    nyantai:[]
};

function updateData(){
    rekap_data["one_day"] = [];
    rekap_data["deket_dl"] = [];
    rekap_data["nyantai"] = [];

    for(let i = 0; i < rows.length; i++){
        if(rows[i].get('Tanggal DL') === undefined || "#N/A"){
            break;
        }

        const sub = [];
        sub.push(rows[i].get('Status'));
        sub.push(rows[i].get('Kode Kelas'));
        sub.push(rows[i].get('Judul Tugas'));
        
        if(sub[0].slice(0, 2) == "Lewat DL"){
            continue;
        }

        else if(sub[0].slice(0, 3) == "H-1" || "H-2" || "H-3"){
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
    console.log(rekap_data);
};

function startUpdate(){
    updateData();
    cron.schedule('0,10,20,30,40,50 * * * *', updateData);
}

function getData(){
    return rekap_data;
}

export { startUpdate, getData};