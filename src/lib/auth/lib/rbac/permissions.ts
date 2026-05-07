import { getPrismaClient } from './prisma-client';

/**
 * Permission Utility Functions
 *
 * These functions check user permissions based on the RBAC system.
 * They query the database to determine if a user has specific permissions
 * through their assigned roles.
 */

/**
 * Check if a user has a specific permission
 * @param userId - The user's ID
 * @param permissionName - The permission name (e.g., "posts.manage")
 * @returns Promise<boolean> - True if user has the permission
 */
export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  try {
    const userRoleAssignment = await getPrismaClient().userRoleAssignment.findFirst({
      where: {
        userId,
        role: {
          permissions: {
            some: {
              permission: {
                name: permissionName,
              },
            },
          },
        },
      },
    });

    return !!userRoleAssignment;
  } catch (error) {
    console.error(`Error checking permission "${permissionName}" for user ${userId}:`, error);
    return false;
  }
}

/**
 * Check if a user has any of the specified permissions
 * @param userId - The user's ID
 * @param permissionNames - Array of permission names
 * @returns Promise<boolean> - True if user has at least one of the permissions
 */
export async function hasAnyPermission(
  userId: string,
  permissionNames: string[]
): Promise<boolean> {
  if (permissionNames.length === 0) {
    return false;
  }

  try {
    const userRoleAssignment = await getPrismaClient().userRoleAssignment.findFirst({
      where: {
        userId,
        role: {
          permissions: {
            some: {
              permission: {
                name: {
                  in: permissionNames,
                },
              },
            },
          },
        },
      },
    });

    return !!userRoleAssignment;
  } catch (error) {
    console.error(`Error checking permissions for user ${userId}:`, error);
    return false;
  }
}

/**
 * Check if a user has all of the specified permissions
 * @param userId - The user's ID
 * @param permissionNames - Array of permission names
 * @returns Promise<boolean> - True if user has all of the permissions
 */
export async function hasAllPermissions(
  userId: string,
  permissionNames: string[]
): Promise<boolean> {
  if (permissionNames.length === 0) {
    return true;
  }

  try {
    // Get all user permissions
    const userPermissions = await getUserPermissions(userId);

    // Check if all required permissions are present
    return permissionNames.every((permissionName) => userPermissions.includes(permissionName));
  } catch (error) {
    console.error(`Error checking all permissions for user ${userId}:`, error);
    return false;
  }
}

/**
 * Get all permissions for a user
 * @param userId - The user's ID
 * @returns Promise<string[]> - Array of permission names
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const userRoleAssignments = await getPrismaClient().userRoleAssignment.findMany({
      where: {
        userId,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Flatten and deduplicate permission names
    const permissionSet = new Set<string>();

    userRoleAssignments.forEach((assignment) => {
      assignment.role.permissions.forEach((rolePermission) => {
        permissionSet.add(rolePermission.permission.name);
      });
    });

    return Array.from(permissionSet);
  } catch (error) {
    console.error(`Error getting permissions for user ${userId}:`, error);
    return [];
  }
}

/**
 * Get all roles assigned to a user
 * @param userId - The user's ID
 * @returns Promise<Role[]> - Array of role objects with their details
 */
export async function getUserRoles(userId: string) {
  try {
    const userRoleAssignments = await getPrismaClient().userRoleAssignment.findMany({
      where: {
        userId,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    return userRoleAssignments.map((assignment) => assignment.role);
  } catch (error) {
    console.error(`Error getting roles for user ${userId}:`, error);
    return [];
  }
}
