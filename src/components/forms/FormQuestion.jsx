/* One question of a COMEX form, rendered as a V1 form control for its answer
 * type (V2's FormFieldsPanel field editors, without V2's styling). */
import { FieldError, Label, TextField } from '../Form'

const INPUT_TYPES = { date: 'date', time: 'time', email: 'email', tel: 'tel', number: 'number', currency: 'number' }
const boxClass = 'w-full rounded-sm border border-gray-400 bg-white px-2.5 py-2 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20'

function readImage(file, onDone) {
  const reader = new FileReader()
  reader.onload = () => onDone({ imageUrl: reader.result, imageName: file.name })
  reader.readAsDataURL(file)
}

function TableAnswer({ definition, value, onChange }) {
  const rows = Array.isArray(value) ? value : []
  const shown = Math.min(definition.rowCount, Math.max(rows.length + 1, 3))
  const setCell = (index, key, cell) => {
    const next = Array.from({ length: Math.max(rows.length, index + 1) }, (_, i) => ({ ...rows[i] }))
    next[index][key] = cell
    while (next.length && Object.values(next.at(-1)).every((v) => v === '' || v == null)) next.pop()
    onChange(next)
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-md border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-8 border border-gray-300 bg-gray-50 px-2 py-1 text-left">#</th>
            {definition.columns.map((c) => <th key={c.key} className="border border-gray-300 bg-gray-50 px-2 py-1 text-left font-semibold">{c.label ?? c.key}</th>)}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: shown }, (_, index) => (
            <tr key={index}>
              <td className="border border-gray-300 px-2 text-gray-600">{index + 1}</td>
              {definition.columns.map((c) => (
                <td key={c.key} className="border border-gray-300 p-0">
                  <input
                    aria-label={`${c.label ?? c.key}, row ${index + 1}`}
                    type={INPUT_TYPES[c.type] ?? 'text'}
                    value={rows[index]?.[c.key] ?? ''}
                    onChange={(e) => setCell(index, c.key, e.target.value)}
                    className="w-full px-2 py-1.5 outline-none focus:bg-indigo-50"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-xs text-gray-600">Up to {definition.rowCount} rows; a new row appears as you fill the last one.</p>
    </div>
  )
}

export default function FormQuestion({ definition, value, onChange, error }) {
  const id = `q-${definition.id}`
  const { type, label, required } = definition
  if (type === 'checkbox') {
    return (
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 accent-navy" />
        <span>{label}{required && <span className="text-red-600">*</span>}</span>
      </label>
    )
  }
  if (['singleChoice', 'scale', 'multiChoice'].includes(type)) {
    const many = type === 'multiChoice'
    const picked = many ? (Array.isArray(value) ? value : []) : value
    const toggle = (optionId) => onChange(many ? (picked.includes(optionId) ? picked.filter((v) => v !== optionId) : [...picked, optionId]) : optionId)
    return (
      <fieldset>
        <legend className="mb-1 text-sm font-semibold text-gray-900">{label}{required && <span className="text-red-600">*</span>}</legend>
        {definition.help && <p className="mb-1 text-xs text-gray-600">{definition.help}</p>}
        <div className={`flex flex-wrap gap-x-4 gap-y-1 ${type === 'scale' ? '' : 'flex-col'}`}>
          {definition.options.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-sm">
              <input type={many ? 'checkbox' : 'radio'} name={id} checked={many ? picked.includes(o.id) : picked === o.id} onChange={() => toggle(o.id)} className="size-4 accent-navy" />
              {o.label}
            </label>
          ))}
          {!many && picked && <button type="button" onClick={() => onChange('')} className="text-xs text-navy underline">Clear</button>}
        </div>
        <FieldError id={`${id}-error`}>{error}</FieldError>
      </fieldset>
    )
  }
  if (type === 'table') {
    return (
      <div>
        <Label required={required}>{label}</Label>
        <TableAnswer definition={definition} value={value} onChange={onChange} />
      </div>
    )
  }
  if (type === 'image') {
    return (
      <div>
        <Label htmlFor={id} required={required}>{label}</Label>
        <input id={id} type="file" accept="image/png,image/jpeg" onChange={(e) => e.target.files[0] && readImage(e.target.files[0], onChange)} className="text-sm" />
        {value?.imageName && (
          <p className="mt-1 flex items-center gap-2 text-xs text-gray-700">
            Attached: {value.imageName}
            <button type="button" onClick={() => onChange(null)} className="text-navy underline">Remove</button>
          </p>
        )}
      </div>
    )
  }
  if (type === 'paragraph') {
    return (
      <div>
        <Label htmlFor={id} required={required}>{label}</Label>
        <textarea id={id} rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={boxClass} aria-invalid={!!error} />
        <FieldError id={`${id}-error`}>{error}</FieldError>
      </div>
    )
  }
  return (
    <TextField
      id={id}
      label={label}
      required={required}
      error={error}
      type={INPUT_TYPES[type] ?? 'text'}
      step={type === 'currency' ? '0.01' : undefined}
      placeholder={type === 'signature' ? 'Type the full name that signs here' : undefined}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
