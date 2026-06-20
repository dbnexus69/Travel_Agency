const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateToken, getExpiryTime } = require('../utils/tokenUtils');
const { success, error } = require('../utils/apiResponse');
const emailService = require('../utils/emailService');

const resetCodes = new Map(); // key: email (lowercase), value: { code, expiresAt }


exports.login = async (req, res, next) => {
  try {
    const { email, password, remember } = req.body;

    if (!email || !password) {
      return error(res, 'Correo y contraseña requeridos', 400);
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        persona: { include: { tipoDocumento: true } },
        rol: { include: { permisosRol: { include: { permiso: true } } } },
        permisosUsuario: { include: { permiso: true } }
      }
    });

    if (!usuario) {
      return error(res, 'Usuario no encontrado', 401);
    }

    const validPassword = await bcrypt.compare(password, usuario.passwordHash);
    if (!validPassword) {
      return error(res, 'Contraseña incorrecta', 401);
    }

    if (usuario.status === 'inactive') {
      return error(res, 'Usuario inactivo. Contacte al administrador', 401);
    }

    const token = generateToken({ userId: usuario.id, role: usuario.rol.nombre }, remember);
    const expiresAt = new Date(getExpiryTime(remember));

    await prisma.sesiones.create({
      data: {
        usuarioId: usuario.id,
        tokenHash: token,
        expiresAt,
        userAgent: req.headers['user-agent'] || null
      }
    });

    await prisma.usuarios.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() }
    });

    let permisos = usuario.rol.permisosRol.map(pr => ({
      modulo: pr.permiso.modulo, accion: pr.permiso.accion, valor: pr.valor
    }));
    const userPermisos = usuario.permisosUsuario
      .filter(pu => pu.permitido)
      .map(pu => ({ modulo: pu.permiso.modulo, accion: pu.permiso.accion, valor: pu.valor }));
    permisos = [...permisos, ...userPermisos];

    const maxAge = remember ? 1000 * 60 * 60 * 24 * 7 : 1000 * 60 * 60 * 24;
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge
    });

    success(res, {
      user: {
        id: usuario.id,
        personaId: usuario.personaId,
        name: `${usuario.persona.nombres} ${usuario.persona.apellidos}`,
        firstName: usuario.persona.nombres,
        lastName: usuario.persona.apellidos,
        email: usuario.email,
        role: usuario.rol.nombre,
        avatar: usuario.persona.avatarUrl,
        phone: usuario.persona.telefono,
        status: usuario.status,
        docType: usuario.persona.tipoDocumento?.abreviatura || null,
        docNumber: usuario.persona.documento,
        lastLogin: usuario.ultimoLogin,
        permisos
      },
      token,
      expiresAt
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token = header.split(' ')[1];
      await prisma.sesiones.deleteMany({ where: { tokenHash: token } });
    }
    
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    success(res, { message: 'Sesión cerrada' });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { id: req.user.id },
      include: {
        persona: { include: { tipoDocumento: true } },
        rol: { include: { permisosRol: { include: { permiso: true } } } },
        permisosUsuario: { include: { permiso: true } }
      }
    });

    let permisos = usuario.rol.permisosRol.map(pr => ({
      modulo: pr.permiso.modulo, accion: pr.permiso.accion, valor: pr.valor
    }));
    const userPermisos = usuario.permisosUsuario
      .filter(pu => pu.permitido)
      .map(pu => ({ modulo: pu.permiso.modulo, accion: pu.permiso.accion, valor: pu.valor }));
    permisos = [...permisos, ...userPermisos];

    success(res, {
      id: usuario.id,
      personaId: usuario.personaId,
      name: `${usuario.persona.nombres} ${usuario.persona.apellidos}`,
      firstName: usuario.persona.nombres,
      lastName: usuario.persona.apellidos,
      email: usuario.email,
      role: usuario.rol.nombre,
      avatar: usuario.persona.avatarUrl,
      phone: usuario.persona.telefono,
      status: usuario.status,
      docType: usuario.persona.tipoDocumento?.abreviatura || null,
      docNumber: usuario.persona.documento,
      lastLogin: usuario.ultimoLogin,
      permisos
    });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return error(res, 'El correo electrónico es requerido', 400);
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { email: email.toLowerCase() },
      include: { persona: true }
    });

    if (!usuario) {
      return error(res, 'No existe ningún usuario registrado con este correo', 404);
    }

    if (usuario.status === 'inactive') {
      return error(res, 'Usuario inactivo. Contacte al administrador', 400);
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // Valid for 15 minutes

    resetCodes.set(email.toLowerCase(), { code, expiresAt });

    // Send email using emailService
    await emailService.sendEmail({
      to: email.toLowerCase(),
      subject: 'iTea Travel - Código de recuperación de contraseña',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaec; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">iTea Travel</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px;">Hola <strong>${usuario.persona.nombres}</strong>,</p>
            <p style="font-size: 16px;">Has solicitado restablecer tu contraseña. Utiliza el siguiente código para completar el proceso:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background-color: #f1f5f9; padding: 15px 30px; border-radius: 8px; border: 1px dashed #cbd5e1; display: inline-block;">
                ${code}
              </span>
            </div>
            <p style="font-size: 14px; color: #64748b;">Este código es válido por 15 minutos. Si no has solicitado este cambio, por favor ignora este correo.</p>
          </div>
        </div>
      `
    });

    success(res, { message: 'Código de recuperación enviado al correo' });
  } catch (err) {
    next(err);
  }
};

exports.verifyCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return error(res, 'Correo y código son requeridos', 400);
    }

    const record = resetCodes.get(email.toLowerCase());
    if (!record) {
      return error(res, 'No se ha solicitado una recuperación de contraseña para este correo', 400);
    }

    if (Date.now() > record.expiresAt) {
      resetCodes.delete(email.toLowerCase());
      return error(res, 'El código ha expirado. Por favor, solicita uno nuevo', 400);
    }

    if (record.code !== code.trim()) {
      return error(res, 'Código de recuperación incorrecto', 400);
    }

    success(res, { message: 'Código verificado correctamente' });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return error(res, 'Todos los campos son requeridos', 400);
    }

    const record = resetCodes.get(email.toLowerCase());
    if (!record) {
      return error(res, 'No se ha solicitado una recuperación de contraseña para este correo', 400);
    }

    if (Date.now() > record.expiresAt) {
      resetCodes.delete(email.toLowerCase());
      return error(res, 'El código ha expirado. Por favor, solicita uno nuevo', 400);
    }

    if (record.code !== code.trim()) {
      return error(res, 'Código de recuperación incorrecto', 400);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    const usuario = await prisma.usuarios.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!usuario) {
      return error(res, 'Usuario no encontrado', 404);
    }

    // Update password
    await prisma.usuarios.update({
      where: { id: usuario.id },
      data: { passwordHash }
    });

    // Remove code from cache
    resetCodes.delete(email.toLowerCase());

    success(res, { message: 'Contraseña restablecida exitosamente' });
  } catch (err) {
    next(err);
  }
};

