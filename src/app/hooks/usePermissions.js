'use client';

import { useAuthStore } from '../store/authStore';

/**
 * Hook to check user permissions by numeric Id.
 * Maps to the same permission Ids as waba-chat:
 *  1 - View All Chats
 *  2 - View Team Chats
 *  3 - View Own Chats
 *  4 - Access Unassigned Chat Pool
 *  5 - Reassign / Escalate Chat
 *  6 - Reply to Customer (Text/Media)
 *  7 - Archive Chat
 *  8 - Close Chat (Mark Done)
 *  9 - Product Sharing
 * 10 - Export Data
 * 11 - Delete Chat/Customer Data
 * 15 - Customers list
 * 16 - Allow ATM binding customers
 *
 * Usage:
 *   const { can } = usePermissions();
 *   if (can(6)) { ... }
 */
export function usePermissions() {
  const can = useAuthStore((s) => s.can);
  const permissions = useAuthStore((s) => s.permissions);

  return {
    can,
    permissions,
  };
}
