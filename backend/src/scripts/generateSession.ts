import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
// @ts-ignore
import input from 'input';
import * as dotenv from 'dotenv';

dotenv.config();

(async () => {
  const apiId = parseInt(process.env.TELEGRAM_API_ID || await input.text('Enter your API_ID: '));
  const apiHash = process.env.TELEGRAM_API_HASH || await input.text('Enter your API_HASH: ');
  const stringSession = new StringSession(''); // Empty string means new session

  console.log('Loading interactive Telegram login...');
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text('Please enter your Phone Number (intl format, e.g., +1234567890): '),
    password: async () => await input.text('Please enter your 2FA Password (leave empty if not enabled): '),
    phoneCode: async () => await input.text('Please enter the Telegram Login Code you received: '),
    onError: (err) => console.log('Login error:', err),
  });

  console.log('\n--- SUCCESS! You are successfully logged in. ---');
  console.log('Please add the following to your backend/.env file:\n');
  console.log(`TELEGRAM_SESSION=${client.session.save()}`);
  console.log('\n------------------------------------------------\n');
  
  process.exit(0);
})();
