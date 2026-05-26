const { verifyToken } = require('../utils/tokenUtils');
const prisma = require('../config/db');
const { error } = require('../utils/apiResponse');

// Caché en memoria para evitar golpear la Base de Datos en cada clic (TTL: 5 minutos)
const AUTH_CACHE = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      // BYPASS PARA PRUEBAS
      req.user = { id: 1, role: 'admin' };
      req.permissionScope = 'all';
      return next();
    }

    const token = header.split(' ')[1];
    const decoded = verifyToken(token);

    // 1. Revisar si el usuario está en RAM Cache
    const now = Date.now();
    const cached = AUTH_CACHE.get(decoded.userId);
    
    if (cached && cached.expiresAt > now) {
      req.user = cached.user;
      return next();
    }

    // 2. Si no está en caché, consultar a Supabase (viaje pesado)
    const usuario = await prisma.usuarios.findUnique({
      where: { id: decoded.userId },
      include: {
        persona: true,
        rol: {
          include: {
            permisosRol: { include: { permiso: true } }
          }
        },
        permisosUsuario: { include: { permiso: true } }
      }
    });

    if (!usuario || usuario.status === 'inactive') {
      return error(res, 'Usuario no encontrado o inactivo', 401, 'USER_INACTIVE');
    }

    const userData = {
      id: usuario.id,
      personaId: usuario.personaId,
      email: usuario.email,
      nombre: `${usuario.persona.nombres} ${usuario.persona.apellidos}`,
      avatarUrl: usuario.persona.avatarUrl,
      role: usuario.rol.nombre,
      permisosRol: usuario.rol.permisosRol.map(pr => ({
        modulo: pr.permiso.modulo,
        accion: pr.permiso.accion,
        valor: pr.valor
      })),
      permisosUsuario: usuario.permisosUsuario.filter(pu => pu.permitido).map(pu => ({
        modulo: pu.permiso.modulo,
        accion: pu.permiso.accion,
        valor: pu.valor
      }))
    };

    // 3. Guardar en RAM Cache para la próxima vez
    AUTH_CACHE.set(decoded.userId, {
      user: userData,
      expiresAt: now + CACHE_TTL_MS
    });

    req.user = userData;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return error(res, 'Token inválido o expirado', 401, 'INVALID_TOKEN');
    }
    next(err);
  }
}

module.exports = auth;
