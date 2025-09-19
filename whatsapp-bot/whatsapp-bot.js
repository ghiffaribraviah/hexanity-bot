import { wa_text, wa_text_update } from "../spreadsheet/text-wa.js";
import 'dotenv/config';
import { makeWASocket, DisconnectReason, useMultiFileAuthState, Browsers } from '@whiskeysockets/baileys';
import qrcode from 'qrcode';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

export async function startWhatsappBot(){
    wa_text_update();

    function humanizeChat(sock, from, text){
        const seenTimer = (Math.floor(Math.random() * 5) + 1) * 1000;
        const typeTimer = (Math.floor(Math.random() * 5) + 5) * 1000 + seenTimer;
        const sendTimer = (Math.floor(Math.random() * 5) + 5) * 1000 + typeTimer;

        setTimeout(async () => {
            try {
                await sock.presenceSubscribe(from);
                await sock.sendPresenceUpdate('available', from);
                await sock.readMessages([{ remoteJid: from, id: '' }]);
            } catch (error) {
                console.log('Error in presence update:', error.message);
            }
        }, seenTimer);
        
        setTimeout(async () => {
            try {
                await sock.sendPresenceUpdate('composing', from);
            } catch (error) {
                console.log('Error in composing update:', error.message);
            }
        }, typeTimer);

        setTimeout(async () => {
            try {
                await sock.sendPresenceUpdate('paused', from);
            } catch (error) {
                console.log('Error in paused update:', error.message);
            }
        }, sendTimer - 500);

        setTimeout(async function(){
            try {
                await sock.sendMessage(from, { text: text });
                setTimeout(async () => {
                    try {
                        await sock.sendPresenceUpdate('unavailable', from);
                    } catch (error) {
                        console.log('Error in unavailable update:', error.message);
                    }
                }, 2000); 
            } catch (error) {
                console.log('Error sending message:', error.message);
            }
        }, sendTimer);
    }

    async function dailyReminder(sock){
        console.log("Whatsapp Daily Reminder started!");
        cron.schedule('0 10,16,22 * * *', async() => {
            try {
                const number = process.env.TARGET_NUMBER_ID;
                const chatId = number.includes('@g.us') ? number : number.replace('+', '') + '@c.us';
                humanizeChat(sock, chatId, wa_text);
            } catch (error) {
                console.log('Error in daily reminder:', error.message);
            }
        });
    }

    async function connectToWhatsApp() {
        try {
            const authPath = './wa_auth_info';
            const { state, saveCreds } = await useMultiFileAuthState(authPath);

            const sock = makeWASocket({
                auth: state,
                browser: Browsers.ubuntu('Hexanity Bot'),
                logger: {
                    level: 'silent',
                    trace: () => {},
                    debug: () => {},
                    info: () => {},
                    warn: () => {},
                    error: () => {},
                    fatal: () => {},
                    child: () => ({
                        level: 'silent',
                        trace: () => {},
                        debug: () => {},
                        info: () => {},
                        warn: () => {},
                        error: () => {},
                        fatal: () => {}
                    })
                },
                markOnlineOnConnect: true,
                generateHighQualityLinkPreview: true,
                syncFullHistory: false,
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 60000,
                keepAliveIntervalMs: 10000,
                emitOwnEvents: false,
                fireInitQueries: true,
                shouldSyncHistoryMessage: () => false
            });

            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    const qrTerminal = await qrcode.toString(qr, { type: 'terminal', small: true });
                    console.log("⚡ QR Code received! Scan this QR with WhatsApp:");
                    console.log(qrTerminal);

                    // Simpan juga ke file 
                    try {
                        await qrcode.toFile('qr.png', qr);
                        console.log('💾 QR code also saved as qr.png');
                    } catch (error) {
                        console.log('Error saving QR file:', error.message);
                    }
                }

                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                    console.log('❌ Connection closed:', lastDisconnect?.error?.message || 'Unknown error');
                    
                    if (lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut) {
                        console.log('🚪 Logged out. Clearing auth data...');
                        if (fs.existsSync(authPath)) {
                            fs.rmSync(authPath, { recursive: true, force: true });
                        }
                        console.log('🔄 Please restart the bot to login again.');
                    } else if (shouldReconnect) {
                        console.log('🔄 Attempting to reconnect in 5 seconds...');
                        setTimeout(() => {
                            connectToWhatsApp();
                        }, 5000);
                    }
                } else if (connection === 'open') {
                    console.log('✅ WhatsApp Bot connected successfully!');
                    dailyReminder(sock);
                } else if (connection === 'connecting') {
                    console.log('🔗 Connecting to WhatsApp...');
                }
            });

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on('messages.upsert', async (m) => {
                try {
                    const message = m.messages[0];
                    
                    if (!message.key.fromMe && message.message) {
                        const messageText = message.message.conversation || 
                                          message.message.extendedTextMessage?.text || '';
                        
                        if (messageText === "#RekapDongSekre") {
                            console.log("📊 Rekap requested from:", message.key.remoteJid);
                            humanizeChat(sock, message.key.remoteJid, wa_text);
                        }
                    }
                } catch (error) {
                    console.log('Error processing message:', error.message);
                }
            });

            return sock;
        } catch (error) {
            console.error('❌ Error connecting to WhatsApp:', error.message);
            console.log('🔄 Retrying connection in 10 seconds...');
            setTimeout(() => {
                connectToWhatsApp();
            }, 10000);
        }
    }

    await connectToWhatsApp();
}