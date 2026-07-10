import { config } from 'dotenv';
config();
import { sendScheduleNotificationEmail } from './src/lib/mailer';

async function main() {
  console.log('Sending test email to kylegraniten348@gmail.com...');
  try {
    const info = await sendScheduleNotificationEmail({
      to: 'kylegraniten348@gmail.com',
      name: 'Kyle Graniten',
      typeLabel: 'Consultation',
      title: 'Test Consultation from Script',
      dateLabel: 'July 10, 2026, 10:00 AM',
      location: 'Zoom',
      notes: 'Test email from backend script'
    });
    console.log('Email sent successfully!', info);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

main().catch(console.error);
