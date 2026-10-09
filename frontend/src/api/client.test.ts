import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, errorMessage, request, toQueryString } from './client'

describe('toQueryString', () => {
  it('drops empty values', () => {
    expect(toQueryString({ q: 'priya', country: undefined, page: 2, department: '' })).toBe(
      '?q=priya&page=2',
    )
  })
  it('returns empty string with no params', () => {
    expect(toQueryString({})).toBe('')
  })
})

describe('errorMessage', () => {
  it('passes through string detail', () => {
    expect(errorMessage({ detail: 'email already in use' }, 'x')).toBe('email already in use')
  })
  it('flattens pydantic validation errors', () => {
    const body = { detail: [{ loc: ['body', 'salary'], msg: 'must be > 0' }] }
    expect(errorMessage(body, 'x')).toBe('salary: must be > 0')
  })
  it('falls back for unknown bodies', () => {
    expect(errorMessage(null, 'fallback')).toBe('fallback')
  })
})

describe('request', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('throws ApiError with status and server message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'not found' }), { status: 404 })),
    )
    await expect(request('/api/employees/1')).rejects.toEqual(new ApiError(404, 'not found'))
  })

  it('returns undefined for 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
    await expect(request('/api/employees/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })
})
