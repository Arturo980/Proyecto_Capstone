const nodemailer = require('nodemailer');

// Configuración del transporter para nodemailer
const createTransporter = () => {
  // Para Gmail u otros proveedores SMTP
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true para puerto 465, false para otros puertos
    auth: {
      user: process.env.SMTP_USER, // tu email
      pass: process.env.SMTP_PASS, // tu contraseña de aplicación
    },
  });
};

// Función para enviar email de recuperación de contraseña
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();
    
    // URL del frontend donde el usuario podrá resetear su contraseña
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'GameTime - Recuperación de Contraseña',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">GameTime</h1>
            <h2 style="color: #666; font-weight: normal;">Recuperación de Contraseña</h2>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">
              Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en GameTime.
            </p>
            
            <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
              Haz clic en el siguiente botón para crear una nueva contraseña:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetURL}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Restablecer Contraseña
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 10px;">
              O copia y pega este enlace en tu navegador:
            </p>
            <p style="word-break: break-all; color: #007bff; font-size: 14px;">
              ${resetURL}
            </p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px;">
            <p style="color: #999; font-size: 12px; line-height: 1.4; margin-bottom: 10px;">
              <strong>Importante:</strong> Este enlace expirará en 1 hora por motivos de seguridad.
            </p>
            
            <p style="color: #999; font-size: 12px; line-height: 1.4; margin-bottom: 10px;">
              Si no solicitaste este cambio de contraseña, puedes ignorar este correo electrónico de forma segura.
            </p>
            
            <p style="color: #999; font-size: 12px; line-height: 1.4;">
              Saludos,<br>
              El equipo de GameTime
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error enviando email de recuperación:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
};
