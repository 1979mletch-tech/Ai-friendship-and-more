// Layer 1: Core Business Brain Service
// Maintains BuildRush company facts, operating rules, assistant identities,
// owner-approved operating rules, and durable business policies across restarts.

import { UK_TRADE_GUIDANCE, PRICING_DISCLAIMER } from '../config/pricingGuidance'
import type { CoreKnowledgeItem } from '../types'

export class CoreBrainService {
  private static instance: CoreBrainService
  private knowledge: Map<string, CoreKnowledgeItem> = new Map()

  private constructor() {
    this.seedDefaultKnowledge()
  }

  public static getInstance(): CoreBrainService {
    if (!CoreBrainService.instance) {
      CoreBrainService.instance = new CoreBrainService()
    }
    return CoreBrainService.instance
  }

  private seedDefaultKnowledge(): void {
    const defaults: Array<Omit<CoreKnowledgeItem, 'id' | 'updatedAt'>> = [
      {
        category: 'operating_rules',
        key: 'marketplace_budget_and_urgency',
        isActive: true,
        updatedBy: 'system',
        value: {
          customerRule: 'Customers post work and set their own proposed budget.',
          tradespersonRule: 'Tradespeople decide which jobs to pursue and quote freely.',
          responseAim: 'Aims for prompt repairs (today/tomorrow or within 48 hours where feasible).',
          guaranteeProhibition: 'NEVER guarantee a confirmed booking, fixed price, or 48-hour completion.',
        },
      },
      {
        category: 'contingency_rule',
        key: 'tradesperson_contingency_boundary',
        isActive: true,
        updatedBy: 'system',
        value: {
          policy: 'The optional £50 contingency for established tradespeople after 6 months of meaningful activity is a potential future discretionary owner-managed arrangement only.',
          enforcement: 'DO NOT build into the public website, do NOT automate approvals, do NOT advertise entitlement, and do NOT create a loan feature.',
        },
      },
      {
        category: 'company_policy',
        key: 'data_retention_and_privacy',
        isActive: true,
        updatedBy: 'system',
        value: {
          jurisdiction: 'UK GDPR / Data Protection Act 2018',
          rights: ['access', 'rectification', 'erasure', 'data_portability'],
          indefiniteRetentionPromise: false,
          crossAccountIsolation: 'Strict isolation. Public AI memory must never expose other customers or tradespeople data.',
        },
      },
      {
        category: 'uk_pricing',
        key: 'uk_trade_benchmarks',
        isActive: true,
        updatedBy: 'system',
        value: {
          disclaimer: PRICING_DISCLAIMER,
          benchmarks: UK_TRADE_GUIDANCE,
        },
      },
      {
        category: 'assistant_identity',
        key: 'public_customer_ai_identity',
        isActive: true,
        updatedBy: 'system',
        value: {
          name: 'BuildRush Assistant',
          avatarUrl: '/avatars/buildrush-customer-ai.svg',
          isAiDisclosed: true,
          role: 'Friendly, knowledgeable marketplace assistant for customers and tradespeople.',
          tone: 'Friendly, honest, grounded in UK context, transparent, non-committal on promises.',
        },
      },
      {
        category: 'assistant_identity',
        key: 'private_owner_ai_identity',
        isActive: true,
        updatedBy: 'system',
        value: {
          name: 'BuildRush HQ Advisor',
          avatarUrl: '/avatars/buildrush-owner-ai.svg',
          isAiDisclosed: true,
          role: 'Executive operational assistant for the authorised business owner.',
          tone: 'Rigorous, sourced, action-oriented, requires confirmation for sensitive actions.',
        },
      },
    ]

    const now = new Date().toISOString()
    defaults.forEach((item, index) => {
      this.knowledge.set(item.key, {
        ...item,
        id: `core-brain-${index + 1}`,
        updatedAt: now,
      })
    })
  }

  public getKnowledge(key: string): CoreKnowledgeItem | undefined {
    const item = this.knowledge.get(key)
    return item?.isActive ? item : undefined
  }

  public getAllActiveKnowledge(): CoreKnowledgeItem[] {
    return Array.from(this.knowledge.values()).filter((item) => item.isActive)
  }

  public updateKnowledge(key: string, value: Record<string, unknown>, updatedBy: string): boolean {
    const existing = this.knowledge.get(key)
    if (!existing) return false
    this.knowledge.set(key, {
      ...existing,
      value,
      updatedBy,
      updatedAt: new Date().toISOString(),
    })
    return true
  }

  public getPublicCustomerAiPromptContext(): string {
    const opRules = this.getKnowledge('marketplace_budget_and_urgency')?.value
    const identity = this.getKnowledge('public_customer_ai_identity')?.value
    return [
      `You are ${identity?.name ?? 'BuildRush Assistant'}, a clearly labeled AI helper on the public BuildRush site.`,
      'Help customers describe and post jobs, set budgets, and understand typical UK repair prices.',
      'Help tradespeople find and understand suitable jobs, applications, and subscriptions.',
      `Operating rules: ${JSON.stringify(opRules ?? {})}.`,
      PRICING_DISCLAIMER,
      'Never fabricate confirmed bookings, tradesperson availability, prices, payments, or guarantees.',
      'If an issue cannot be resolved or is a complaint, offer to escalate to human support.',
    ].join('\n')
  }

  public getOwnerAiPromptContext(): string {
    const identity = this.getKnowledge('private_owner_ai_identity')?.value
    const contingency = this.getKnowledge('tradesperson_contingency_boundary')?.value
    return [
      `You are ${identity?.name ?? 'BuildRush HQ Advisor'}, a private executive AI for the verified business owner at /owner.`,
      'Provide concise, accurate operational reviews based on live business data.',
      'Never pretend to execute sensitive actions (refunds, account suspensions, deletions, policy changes).',
      'All sensitive actions require explicit owner confirmation and logged execution.',
      `Contingency rule reminder: ${JSON.stringify(contingency ?? {})}.`,
      'Never expose owner data or administrative procedures to public users.',
    ].join('\n')
  }
}

export const coreBrainService = CoreBrainService.getInstance()

export function isOwnerOnlyRule(categoryOrKey: string): boolean {
  return categoryOrKey.includes('contingency') || categoryOrKey.includes('owner')
}

export function getOwnerOnlyRules(): Array<{ key: string; value: string }> {
  return [
    {
      key: 'contingency_rule',
      value:
        'The optional £50 contingency for established tradespeople after 6 months of meaningful activity is a potential future discretionary owner-managed arrangement only. DO NOT build into public website, do NOT automate approvals, do NOT advertise entitlement, NEVER advertised or automated, and do NOT create a loan feature.',
    },
  ]
}

