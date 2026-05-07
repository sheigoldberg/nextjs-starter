import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const ROLES = [
  { name: 'viewer', description: 'Can view content' },
  { name: 'editor', description: 'Can create and edit content' },
  { name: 'manager', description: 'Can manage team members and content' },
];

const PERMISSIONS = [
  { name: 'content:read', resource: 'content', action: 'read', description: 'Read content' },
  { name: 'content:write', resource: 'content', action: 'write', description: 'Create and edit content' },
  { name: 'content:delete', resource: 'content', action: 'delete', description: 'Delete content' },
  { name: 'users:read', resource: 'users', action: 'read', description: 'View user list' },
  { name: 'users:manage', resource: 'users', action: 'manage', description: 'Manage users' },
];

async function main() {
  console.log('Seeding roles and permissions...');

  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  // Wire permissions to roles
  const viewerRole = await prisma.role.findUnique({ where: { name: 'viewer' } });
  const editorRole = await prisma.role.findUnique({ where: { name: 'editor' } });
  const managerRole = await prisma.role.findUnique({ where: { name: 'manager' } });
  const contentRead = await prisma.permission.findUnique({ where: { name: 'content:read' } });
  const contentWrite = await prisma.permission.findUnique({ where: { name: 'content:write' } });
  const contentDelete = await prisma.permission.findUnique({ where: { name: 'content:delete' } });
  const usersRead = await prisma.permission.findUnique({ where: { name: 'users:read' } });
  const usersManage = await prisma.permission.findUnique({ where: { name: 'users:manage' } });

  if (viewerRole && contentRead) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: viewerRole.id, permissionId: contentRead.id } },
      update: {},
      create: { roleId: viewerRole.id, permissionId: contentRead.id },
    });
  }

  if (editorRole && contentRead && contentWrite) {
    for (const perm of [contentRead, contentWrite]) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: editorRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: editorRole.id, permissionId: perm.id },
      });
    }
  }

  if (managerRole && contentRead && contentWrite && contentDelete && usersRead && usersManage) {
    for (const perm of [contentRead, contentWrite, contentDelete, usersRead, usersManage]) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: managerRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: managerRole.id, permissionId: perm.id },
      });
    }
  }

  // Seed SUPER_ADMIN user if env vars provided
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  if (adminEmail) {
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: UserRole.SUPER_ADMIN },
      create: {
        email: adminEmail,
        name: 'Admin',
        role: UserRole.SUPER_ADMIN,
      },
    });
    console.log(`Admin user ready: ${admin.email} (${admin.role})`);
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
