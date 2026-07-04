# Telegram MTProto Streaming Backend

This is a highly-performant, modular streaming backend designed to serve video files directly from Telegram via the MTProto protocol. 
It supports HTTP 206 Partial Content (Byte-Range requests), an intelligent L1/L2 Cache, and keeps all Telegram credentials secure on the server side.

## Setup Instructions

### Step 1: Install dependencies

```bash
npm install
```

### Step 2: Generate Telegram Session

You need a valid MTProto session to authenticate the backend. We've provided a simple interactive script for this:

```bash
npm run generate-session
```
Follow the prompts (API ID, Hash, Phone Number, Code). Once complete, it will print out your `TELEGRAM_SESSION` string.

### Step 3: Copy generated session into .env

Rename `.env.example` to `.env` (or create a new `.env` file) and fill in your credentials:

```env
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION=your_generated_session_string
```

### Step 4: Start backend

```bash
npm run dev
```
The Fastify server will start on `http://localhost:3001` (by default).

### Step 5: Upload videos to Telegram
Upload your video files to a private Telegram channel. Get the `channelId` and `messageId` of the uploaded file. In the admin dashboard, input the reference as `channelId_messageId`.

### Step 6: Stream videos from the website
Navigate to your frontend app (`npm run dev` in the root project folder). The `SmartVideoPlayer` will automatically construct range-requests to this backend.

## Production
For production deployment:
```bash
npm run start
```
