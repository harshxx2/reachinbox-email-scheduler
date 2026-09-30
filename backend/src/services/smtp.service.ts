import nodemailer from 'nodemailer';

export async function sendViaEthereal(params: {
  sender: { email: string; username: string; password: string };
  recipient: string;
  subject: string;
  body: string;
}) {
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  requireTLS: true,
  tls: {
    rejectUnauthorized: false,
  },
  auth: {
    user: params.sender.username,
    pass: params.sender.password,
  },
});

  const info = await transporter.sendMail({
    from: params.sender.email,
    to: params.recipient,
    subject: params.subject,
    html: params.body,
  });

  return {
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info) || null,
  };
}
