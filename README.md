# Hexanity Bot

## Fitur

- **Daily Reminder** - Pengingat otomatis di jam 10:00, 16:00, dan 22:00
- **Auto Response** - Respon otomatis untuk perintah `#RekapDongSekre`
- **Discord Integration** - Bot Discord dengan slash commands
- **WhatsApp Integration** - Bot WhatsApp via WAHA (WhatsApp HTTP API)
- **Real-time Events** - WebSocket untuk event real-time dari WAHA
- **Google Sheets Integration** - Sinkronisasi data dengan Google Sheets

## Prerequisites

Pastikan sudah menginstall:

- [Node.js](https://nodejs.org/) (v18 atau lebih baru)
- [Docker](https://www.docker.com/) (untuk WAHA service)
- [Docker Compose](https://docs.docker.com/compose/install/) (untuk menjalankan WAHA dengan Docker Compose)
- [websocat](https://github.com/vi/websocat) (untuk WebSocket Whatsapp)

### Install websocat

**macOS:**
```bash
brew install websocat
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install websocat

# Atau download dari GitHub Releases
wget https://github.com/vi/websocat/releases/download/v1.11.0/websocat.x86_64-unknown-linux-musl
chmod +x websocat.x86_64-unknown-linux-musl
sudo mv websocat.x86_64-unknown-linux-musl /usr/local/bin/websocat
```

**Windows:**
```powershell
# Download dari GitHub Releases
# https://github.com/vi/websocat/releases
```

## Setup & Installation

### 1. Clone Repository

```bash
git clone https://github.com/ghiffaribraviah/hexanity-bot.git
cd hexanity-bot
```

### 2. Install Dependencies

```bash
npm install
# atau
bun install
```

### 3. Konfigurasi Environment

```bash
cp .env.example .env
```

Edit file `.env` sesuai kebutuhan:

```bash
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_GUILD_ID=your_discord_guild_id_here

# MongoDB Configuration  
MONGODB_URI=mongodb://localhost:27017/hexanity-bot

# WhatsApp Target Number (format: nomor@c.us untuk personal, id@g.us untuk group)
TARGET_NUMBER_ID=628123456789@c.us

# Google Sheets Configuration
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY=your_private_key
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id

# WAHA Configuration
WAHA_URL=http://localhost:3000
WAHA_SESSION=default
WAHA_API_KEY=yoursecretkey
```

## Setup WhatsApp (WAHA)

### 1. Jalankan WAHA Service

```bash
cd waha
docker compose up -d
```

### 2. Akses WAHA Dashboard

Buka browser dan kunjungi: http://localhost:3000

### 3. Setup Session WhatsApp

1. **Create Session**: Buat session dengan nama `default`
2. **Scan QR Code**: Scan QR code dengan WhatsApp di HP
3. **Verify Status**: Pastikan status session menjadi `WORKING`

### 4. Setup Webhook

Sebelum menjalankan bot, test WebSocket connection dengan websocat:

```bash
websocat -E "ws://localhost:3000/ws?x-api-key=yoursecretkey&session=default&events=message"
# atau
websocat -E 'wss://your-server-domain/ws?x-api-key=yoursecretkey&session=default&events=message'
```

## Menjalankan Bot

### 1. Jalankan dalam Production Mode

```bash
bun run start
# atau
node run start
```

### 2. Monitoring Logs

Bot akan menampilkan logs seperti:
```
🚀 Starting both bots...
✅ MongoDB connected
Ready! Logged in as YourBot#1234
✅ Discord Bot is ready!
Status sesi WAHA 'default': WORKING
✅ Bot WhatsApp siap digunakan melalui WAHA!
🔌 Menghubungkan ke WebSocket: ws://localhost:3000/ws?x-api-key=yoursecretkey&session=default&events=message
✅ Koneksi WebSocket terhubung ke WAHA
Pengingat harian Whatsapp dimulai!
🎉 Bot WhatsApp WAHA telah terinisialisasi lengkap!
```

## Testing Bot

### Test WhatsApp Bot

1. **Kirim pesan** `#RekapDongSekre` ke nomor WhatsApp yang terhubung
2. **Monitor logs** untuk melihat:
   ```
   📨 Menerima WebSocket event: message dari session: default
   📱 Pesan dari 628123456789@c.us: #RekapDongSekre (fromMe: false)
   Permintaan rekap dari: 628123456789@c.us
   Tanda sudah dibaca dikirim untuk 628123456789@c.us
   Mulai mengetik untuk 628123456789@c.us
   Berhenti mengetik untuk 628123456789@c.us
   ✅ Pesan berhasil dikirim ke 628123456789@c.us
   ```

### Test Discord Bot

1. **Gunakan slash commands** di Discord server
2. **Check bot status** dengan command yang tersedia

## Authors

- **Bravi** : [@hoohkun](https://instagram.com/hoohkun)
- **Raihan PK** : [@raihanpka](https://instagram.com/raihanpka)

## Credits

- [WAHA](https://waha.devlike.pro/) - WhatsApp HTTP API
- [Discord.js](https://discord.js.org/) - Discord bot framework
- [websocat](https://github.com/vi/websocat) - WebSocket tool
