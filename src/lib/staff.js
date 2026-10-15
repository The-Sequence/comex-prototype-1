import { STAFF_TYPES } from '../config/staff.js'

/** Errors for the staff part of the form (only when role is "Others"). */
export function validateStaff({ staffType }) {
  return STAFF_TYPES.some((t) => t.value === staffType) ? {} : { staffType: 'Select your staff type.' }
}
