import type { Meta } from '../api/types'

export const countryOptions = (meta?: Meta) =>
  (meta?.countries ?? []).map((c) => ({ value: c.code, label: `${c.name} (${c.currency})` }))
