// Grounded UK Trade & Repair Price Guidance Engine
// Operating Rule: Pricing guidance is strictly advisory.
// Customers choose their proposed budget; tradespeople set their quotes.
// BuildRush aims for prompt repairs (today/tomorrow or within 48h where feasible)
// but NEVER promises or guarantees an outcome or booking it cannot ensure.

export interface TradeRateGuidance {
  trade: string
  typicalHourlyMin: number
  typicalHourlyMax: number
  emergencyCalloutMin: number
  emergencyCalloutMax: number
  commonRepairs: Array<{
    job: string
    typicalMinGbp: number
    typicalMaxGbp: number
    unit: string
    notes?: string
  }>
}

export const UK_TRADE_GUIDANCE: Record<string, TradeRateGuidance> = {
  plumbing: {
    trade: 'Plumbing & Heating',
    typicalHourlyMin: 45,
    typicalHourlyMax: 85,
    emergencyCalloutMin: 80,
    emergencyCalloutMax: 150,
    commonRepairs: [
      { job: 'Minor leak fix under sink or pipe joint', typicalMinGbp: 60, typicalMaxGbp: 120, unit: 'per repair' },
      { job: 'Tap repair or replacement (labour only)', typicalMinGbp: 50, typicalMaxGbp: 95, unit: 'per tap' },
      { job: 'Standard toilet flush mechanism repair', typicalMinGbp: 65, typicalMaxGbp: 110, unit: 'per toilet' },
      { job: 'Annual boiler service (standard domestic)', typicalMinGbp: 80, typicalMaxGbp: 140, unit: 'per boiler' },
      { job: 'Unblocking internal drain or waste pipe', typicalMinGbp: 70, typicalMaxGbp: 130, unit: 'per job' },
    ],
  },
  electrical: {
    trade: 'Electrical',
    typicalHourlyMin: 45,
    typicalHourlyMax: 90,
    emergencyCalloutMin: 85,
    emergencyCalloutMax: 160,
    commonRepairs: [
      { job: 'Single socket or light switch replacement', typicalMinGbp: 50, typicalMaxGbp: 90, unit: 'per fitting' },
      { job: 'Light fitting installation / replacement', typicalMinGbp: 55, typicalMaxGbp: 100, unit: 'per point' },
      { job: 'Fault finding and circuit repair', typicalMinGbp: 80, typicalMaxGbp: 160, unit: 'first 2 hours' },
      { job: 'Consumer unit / fuse box replacement (certified)', typicalMinGbp: 450, typicalMaxGbp: 750, unit: 'per unit incl. testing' },
    ],
  },
  roofing: {
    trade: 'Roofing & Gutters',
    typicalHourlyMin: 40,
    typicalHourlyMax: 80,
    emergencyCalloutMin: 90,
    emergencyCalloutMax: 175,
    commonRepairs: [
      { job: 'Gutter clearing / minor joint leak repair', typicalMinGbp: 45, typicalMaxGbp: 95, unit: 'per standard house' },
      { job: 'Replacing up to 5 slipped / broken tiles', typicalMinGbp: 90, typicalMaxGbp: 190, unit: 'per job' },
      { job: 'Chimney flashing or leadwork reseal', typicalMinGbp: 140, typicalMaxGbp: 280, unit: 'per section' },
      { job: 'Flat roof emergency patch / felt repair', typicalMinGbp: 120, typicalMaxGbp: 260, unit: 'per patch' },
    ],
  },
  carpentry: {
    trade: 'Carpentry & Joinery',
    typicalHourlyMin: 35,
    typicalHourlyMax: 70,
    emergencyCalloutMin: 70,
    emergencyCalloutMax: 130,
    commonRepairs: [
      { job: 'Internal door hanging (labour)', typicalMinGbp: 45, typicalMaxGbp: 85, unit: 'per door' },
      { job: 'Lock change / fitting new latch or deadlock', typicalMinGbp: 60, typicalMaxGbp: 110, unit: 'per door' },
      { job: 'Skirting board installation', typicalMinGbp: 18, typicalMaxGbp: 30, unit: 'per linear metre' },
    ],
  },
  plastering: {
    trade: 'Plastering & Rendering',
    typicalHourlyMin: 35,
    typicalHourlyMax: 65,
    emergencyCalloutMin: 65,
    emergencyCalloutMax: 120,
    commonRepairs: [
      { job: 'Ceiling plaster skim (average bedroom)', typicalMinGbp: 160, typicalMaxGbp: 320, unit: 'per ceiling' },
      { job: 'Patch repair following leak or hole', typicalMinGbp: 80, typicalMaxGbp: 160, unit: 'per patch' },
      { job: 'Full room skim (walls only, medium room)', typicalMinGbp: 420, typicalMaxGbp: 750, unit: 'per room' },
    ],
  },
  painting: {
    trade: 'Painting & Decorating',
    typicalHourlyMin: 30,
    typicalHourlyMax: 60,
    emergencyCalloutMin: 60,
    emergencyCalloutMax: 110,
    commonRepairs: [
      { job: 'Single room walls & ceiling painting', typicalMinGbp: 220, typicalMaxGbp: 480, unit: 'labour for standard room' },
      { job: 'Exterior window woodwork preparation & gloss', typicalMinGbp: 40, typicalMaxGbp: 80, unit: 'per window' },
    ],
  },
}

export const PRICING_DISCLAIMER =
  'UK Repair-Price Guidance is advisory only and grounded in standard UK trade market averages. ' +
  'Actual quotes vary by location, materials, complexity, and access. ' +
  'Customers set their proposed budget; tradespeople quote independently. ' +
  'BuildRush aims for prompt response (today/tomorrow or within 48 hours where feasible), ' +
  'but does not guarantee job completion timing or fixed prices.'

export function getPriceGuidanceForTrade(trade: string): TradeRateGuidance | null {
  const normalized = trade.toLowerCase().trim()
  for (const [key, guidance] of Object.entries(UK_TRADE_GUIDANCE)) {
    if (normalized.includes(key) || guidance.trade.toLowerCase().includes(normalized)) {
      return guidance
    }
  }
  return null
}
