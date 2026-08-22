import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendTwoFactorCode(email: string, code: string, userName: string): Promise<boolean> {
  try {
    const mailOptions = {
      from: `"PrestaAEA" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Código de Verificación - PrestaAEA',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { padding: 40px 30px; }
              .code-box { background: #f0fdf4; border: 2px dashed #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
              .code { font-size: 36px; font-weight: bold; color: #10b981; letter-spacing: 8px; }
              .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
              .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Código de Verificación</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Autenticación de Dos Factores - PrestaAEA</p>
              </div>
              <div class="content">
                <p>Hola <strong>${userName}</strong>,</p>
                <p>Hemos recibido una solicitud de inicio de sesión para tu cuenta en <strong>PrestaAEA</strong>. Para completar el proceso de autenticación, utiliza el siguiente código de verificación:</p>
                
                <div class="code-box">
                  <div class="code">${code}</div>
                  <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">Este código expira en 10 minutos</p>
                </div>
                
                <p><strong>Instrucciones:</strong></p>
                <ol style="color: #4b5563; line-height: 1.8;">
                  <li>Copia el código de verificación mostrado arriba</li>
                  <li>Ingresa el código en la pantalla de verificación de PrestaAEA</li>
                  <li>El código es válido por <strong>10 minutos</strong> desde su generación</li>
                </ol>
                
                <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">
                  ⚠️ <strong>Importante:</strong> Si no solicitaste este código, ignora este correo y considera cambiar tu contraseña.
                </p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} PrestaAEA. Todos los derechos reservados.</p>
                <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Código 2FA enviado a ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar código 2FA:', error);
    return false;
  }
}

export async function verifyTwoFactorCode(code: string, storedCode: string | null, expiresAt: Date | null): Promise<boolean> {
  if (!storedCode || !expiresAt) return false;
  
  const now = new Date();
  if (now > expiresAt) return false;
  
  return code === storedCode;
}

export function generateTwoFactorCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}
