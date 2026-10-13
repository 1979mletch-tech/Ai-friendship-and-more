import { describe, expect, it } from 'vitest'
import { googleMapsPlaceUrl } from './places'

describe('Aurora maps', () => {
  it('rejects empty and overly long place names', () => {
    expect(googleMapsPlaceUrl('  ')).toBeNull()
    expect(googleMapsPlaceUrl('a'.repeat(201))).toBeNull()
  })
  it('encodes a place name without changing the destination host', () => {
    const link = googleMapsPlaceUrl('Lake Windermere & Ambleside')
    const url = new URL(link!)
    expect(url.origin).toBe('https://www.google.com')
    expect(url.searchParams.get('query')).toBe('Lake Windermere & Ambleside')
  })
})
