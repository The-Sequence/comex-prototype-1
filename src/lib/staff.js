import { OTHER_UNIT, STAFF_TYPES, STAFF_UNITS } from '../config/staff.js'

export const MAX_UNIT_LENGTH = 100

/** Errors for the staff part of the form (only when role is "Others"). */
export function validateStaff({ staffType, unit, otherUnit }) {
  const errors = {}
  if (!STAFF_TYPES.some((t) => t.value === staffType)) errors.staffType = 'Select your staff type.'
  if (!unit) errors.unit = 'Select where you work.'
  else if (unit !== OTHER_UNIT && !STAFF_UNITS.includes(unit)) errors.unit = 'Select where you work.'
  else if (unit === OTHER_UNIT) {
    const text = (otherUnit ?? '').trim()
    if (!text) errors.otherUnit = 'Enter the office or unit you work in.'
    else if (text.length > MAX_UNIT_LENGTH) errors.otherUnit = `Keep it under ${MAX_UNIT_LENGTH} characters.`
  }
  return errors
}

/** The office/unit text that is stored. */
export const unitValue = ({ unit, otherUnit }) => (unit === OTHER_UNIT ? otherUnit.trim() : unit)
