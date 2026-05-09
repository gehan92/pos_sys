// Centralised permission definitions for Malta POS
// Usage: import { can } from '../lib/permissions'
//        can(user, 'reserveTable')  →  true | false

export const PERMISSIONS = {
  // ── Tables ────────────────────────────────────────────────────────────────
  reserveTable:      ['superadmin','admin','owner','manager','supervisor','waiter'],
  cancelReservation: ['superadmin','admin','owner','manager','supervisor'],
  transferTable:     ['superadmin','admin','owner','manager','supervisor','waiter'],
  mergeTable:        ['superadmin','admin','owner','manager','supervisor','waiter'],
  viewReservHistory: ['superadmin','admin','owner','manager'],
  addTable:          ['superadmin','admin','owner','manager','waiter'],
  editTable:         ['superadmin','admin','owner','manager','waiter'],
  deleteTable:       ['superadmin','admin','owner','manager'],
  viewTableRecords:  ['superadmin','admin','owner','manager'],

  // ── Orders ────────────────────────────────────────────────────────────────
  createOrder:       ['superadmin','admin','owner','manager','supervisor','waiter','cashier'],
  editOwnOrder:      ['superadmin','admin','owner','manager','supervisor','waiter','cashier'],
  editAnyOrder:      ['superadmin','admin','owner','manager','supervisor'],
  voidOrder:         ['superadmin','admin','owner','manager','supervisor'],
  applyComp:         ['superadmin','admin','owner','manager','supervisor'],

  // ── Billing ───────────────────────────────────────────────────────────────
  processPayment:    ['superadmin','admin','owner','manager','supervisor','cashier'],

  // ── History / Reports ─────────────────────────────────────────────────────
  viewHistory:       ['superadmin','admin','owner','manager','supervisor'],
  viewEditHistory:   ['superadmin','admin','owner','manager'],
  viewReports:       ['superadmin','admin','owner','manager','supervisor'],

  // ── Inventory ─────────────────────────────────────────────────────────────
  manageInventory:   ['superadmin','admin','owner','manager'],

  // ── Notifications ─────────────────────────────────────────────────────────
  viewAllNotifs:     ['superadmin','admin','owner','manager','supervisor'],
}

/** Returns true if the user has the given permission */
export function can(user, permission) {
  return (PERMISSIONS[permission] || []).includes(user?.role)
}

/** Convenience: returns true if user role is any of the management roles */
export function isManagement(user) {
  return ['superadmin','admin','owner','manager','supervisor'].includes(user?.role)
}
