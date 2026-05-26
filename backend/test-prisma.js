const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPrisma() {
  console.log('--- Test Prisma Puro (Con Relation Load Strategy) ---');
  
  const start1 = Date.now();
  await prisma.usuarios.findMany({
    take: 10,
    relationLoadStrategy: 'join',
    include: {
      persona: { include: { tipoDocumento: true } },
      rol: true,
      permisosUsuario: { include: { permiso: true }, where: { permitido: true } }
    }
  });
  console.log(`[Estrategia JOIN (1 Query a Supabase)]: ${Date.now() - start1}ms`);
}

testPrisma().finally(() => prisma.$disconnect());
