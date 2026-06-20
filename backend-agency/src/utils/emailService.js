const { Resend } = require('resend');

let resend = null;
try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  } else {
    console.warn('⚠️ Advertencia: RESEND_API_KEY no está definida en las variables de entorno. El envío de correos electrónicos estará desactivado.');
  }
} catch (error) {
  console.error('❌ Error al inicializar el cliente Resend:', error);
}

/**
 * Enviar un correo electrónico usando Resend
 * @param {Object} options Opciones del correo
 * @param {string} options.to Correo destino
 * @param {string} options.subject Asunto del correo
 * @param {string} options.html Contenido HTML del correo
 * @param {Array} [options.attachments] Arreglo de adjuntos { filename, content }
 * @returns {Promise<Object>} Resultado del envío
 */
const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    if (!resend) {
      console.warn('⚠️ Envío de correo omitido: El cliente Resend no está inicializado porque falta RESEND_API_KEY.');
      return { success: false, error: new Error('Resend API key missing') };
    }

    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    
    const data = await resend.emails.send({
      from: `iTea Travel <${fromEmail}>`,
      to,
      subject,
      html,
      attachments
    });

    if (data.error) {
      console.error('Error de Resend:', data.error);
      return { success: false, error: data.error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error al enviar correo:', error);
    return { success: false, error };
  }
};

module.exports = {
  sendEmail
};
