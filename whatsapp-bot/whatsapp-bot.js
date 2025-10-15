import { wa_text, wa_text_update } from "../spreadsheet/text-wa.js";
import 'dotenv/config';
import cron from 'node-cron';
import axios from 'axios';

export async function startWhatsappBot(){
    wa_text_update();

    // WAHA API Configuration
    const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3000';
    const WAHA_SESSION = process.env.WAHA_SESSION || 'default';
    const WAHA_API_KEY = process.env.WAHA_API_KEY || 'yoursecretkey';

    const wahaHeaders = {
        'Content-Type': 'application/json',
        'X-Api-Key': WAHA_API_KEY
    };

    // Humanized chat function using WAHA API (following WhatsApp guidelines)
    async function humanizeChat(chatId, text) {
        const seenTimer = (Math.floor(Math.random() * 5) + 1) * 1000;
        const typeTimer = (Math.floor(Math.random() * 5) + 5) * 1000 + seenTimer;
        const sendTimer = (Math.floor(Math.random() * 5) + 5) * 1000 + typeTimer;

        try {
            // Step 1: Send seen (mark as read)
            setTimeout(async () => {
                try {
                    await axios.post(`${WAHA_URL}/api/sendSeen`, {
                        session: WAHA_SESSION,
                        chatId: chatId
                    }, { headers: wahaHeaders });
                    console.log('Tanda sudah dibaca dikirim untuk', chatId);
                } catch (error) {
                    console.log('Gagal mengirim tanda sudah dibaca:', error.message);
                }
            }, seenTimer);

            // Step 2: Start typing
            setTimeout(async () => {
                try {
                    await axios.post(`${WAHA_URL}/api/startTyping`, {
                        session: WAHA_SESSION,
                        chatId: chatId
                    }, { headers: wahaHeaders });
                    console.log('Mulai mengetik untuk', chatId);
                } catch (error) {
                    console.log('Gagal memulai mengetik:', error.message);
                }
            }, typeTimer);

            // Step 3: Stop typing and send message
            setTimeout(async () => {
                try {
                    // Stop typing first
                    await axios.post(`${WAHA_URL}/api/stopTyping`, {
                        session: WAHA_SESSION,
                        chatId: chatId
                    }, { headers: wahaHeaders });
                    console.log('Berhenti mengetik untuk', chatId);

                    // Then send the message
                    const response = await axios.post(`${WAHA_URL}/api/sendText`, {
                        session: WAHA_SESSION,
                        chatId: chatId,
                        text: text
                    }, { headers: wahaHeaders });
                    
                    console.log('✅ Pesan berhasil dikirim ke', chatId);
                } catch (error) {
                    console.log('❌ Gagal mengirim pesan:', error.message);
                }
            }, sendTimer);

        } catch (error) {
            console.log('Gagal pada proses chat manusiawi:', error.message);
        }
    }

    // Convert phone number to chatId format
    function formatChatId(phoneNumber) {
        // Remove any non-numeric characters and +
        const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
        
        // Check if it's a group (ends with @g.us) or already formatted
        if (phoneNumber.includes('@g.us') || phoneNumber.includes('@c.us')) {
            return phoneNumber;
        }
        
        // For individual chats, add @c.us
        return `${cleanNumber}@c.us`;
    }

    async function dailyReminder(){
        console.log("Pengingat harian Whatsapp dimulai!");
        cron.schedule('0 10,16,22 * * *', async() => {
            try {
                const number = process.env.TARGET_NUMBER_ID;
                const chatId = formatChatId(number);
                await humanizeChat(chatId, wa_text);
            } catch (error) {
                console.log('Gagal pada pengingat harian:', error.message);
            }
        });
    }

    // Check WAHA service and session status
    async function checkWAHAStatus() {
        try {
            const response = await axios.get(`${WAHA_URL}/api/sessions/${WAHA_SESSION}`, { 
                headers: wahaHeaders 
            });
            
            const status = response.data.status;
            console.log(`Status sesi WAHA '${WAHA_SESSION}': ${status}`);
            
            if (status === 'WORKING') {
                console.log('✅ Bot WhatsApp siap digunakan melalui WAHA!');
                const me = response.data.me;
                if (me) {
                    console.log(`Terhubung sebagai: ${me.pushName} (${me.id})`);
                }
                return true;
            } else if (status === 'SCAN_QR_CODE') {
                console.log('Sesi membutuhkan scan QR. Silakan cek dashboard WAHA.');
                return false;
            } else {
                console.log(`Status sesi: ${status}`);
                return false;
            }
        } catch (error) {
            console.log('❌ Layanan WAHA tidak tersedia:', error.message);
            console.log('Pastikan WAHA berjalan di', WAHA_URL);
            return false;
        }
    }

    // Handle incoming message from WAHA webhook
    async function handleIncomingMessage(messageData) {
        try {
            const { from, text, fromMe, id } = messageData;
            
            console.log(`Memproses pesan: ${text} dari ${from} (dari saya: ${fromMe})`);
            
            // Only respond to messages not sent by us
            if (!fromMe && text && text.trim() === "#RekapDongSekre") {
                console.log("Permintaan rekap dari:", from);
                
                // Use the exact chatId format from the webhook
                const chatId = from; // WAHA already provides correct format like 6282111639628@c.us
                
                // Send humanized response
                await humanizeChat(chatId, wa_text);
            }
        } catch (error) {
            console.log('Gagal memproses pesan masuk:', error.message);
        }
    }

    // Setup WebSocket connection to listen for WAHA events
    async function setupWebSocketConnection() {
        const WebSocket = (await import('ws')).default;
        
        // WebSocket configuration
        const apiKey = WAHA_API_KEY;
        const baseUrl = WAHA_URL.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws';
        const session = WAHA_SESSION;
        const events = ['message'];
        
        // Construct the WebSocket URL with query parameters
        const queryParams = new URLSearchParams({
            'x-api-key': apiKey,
            session: session,
            events: 'message'
        });
        const wsUrl = `${baseUrl}?${queryParams.toString()}`;
        
        console.log('🔌 Menghubungkan ke WebSocket:', wsUrl);
        
        const socket = new WebSocket(wsUrl);
        
        // Handle connection open
        socket.onopen = () => {
            console.log('✅ Koneksi WebSocket terhubung ke WAHA');
            console.log(`Mendengarkan session: ${session}, events: message`);
        };
        
        // Handle incoming messages
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 Menerima WebSocket event:', data.event, 'dari session:', data.session);
                
                if (data.event === 'message' && data.payload) {
                    const { from, body, fromMe, id } = data.payload;
                    
                    console.log(`Pesan dari ${from}: ${body} (fromMe: ${fromMe})`);
                    
                    // Handle incoming message
                    handleIncomingMessage({
                        from: from,
                        text: body,
                        fromMe: fromMe,
                        id: id
                    });
                }
            } catch (error) {
                console.log('Error parsing WebSocket message:', error.message);
            }
        };
        
        // Handle errors
        socket.onerror = (error) => {
            console.error('❌ WebSocket Error:', error.message);
        };
        
        // Handle connection close
        socket.onclose = (event) => {
            console.log('Koneksi WebSocket tertutup, code:', event.code);
            
            // Reconnect after 5 seconds
            console.log('Mencoba reconnect dalam 5 detik...');
            setTimeout(() => {
                setupWebSocketConnection();
            }, 5000);
        };
        
        return socket;
    }

    // Main initialization
    async function initializeWAHA() {
        console.log('Memulai inisialisasi Bot WhatsApp WAHA...');
        console.log('Menggunakan sesi WAHA:', WAHA_SESSION);
        
        // Check WAHA status (session already exists in dashboard)
        const isReady = await checkWAHAStatus();
        
        if (isReady) {
            // Start daily reminder
            dailyReminder();
            
            // Setup WebSocket connection for real-time events
            await setupWebSocketConnection();
            
            console.log('🎉 Bot WhatsApp WAHA telah terinisialisasi lengkap!');
        } else {
            console.log('❌ Sesi WAHA belum siap. Silakan cek dashboard.');
            
            // Retry after 30 seconds
            setTimeout(() => {
                initializeWAHA();
            }, 30000);
        }
    }

    await initializeWAHA();
}