import { describe, it, expect, vi } from 'vitest'
import { OwnerAiService, detectSensitiveAction } from '../services/ownerAiService'
import { isOwnerOnlyRule, getOwnerOnlyRules } from '../services/coreBrainService'

describe('BuildRush Security & Isolation Tests', () => {
  describe('1. Two-Account & Role Isolation', () => {
    it('prevents non-owners from calling Owner AI endpoints (403 Forbidden)', async () => {
      // Mock fetch returning 403 Forbidden when customer/tradesperson token is supplied
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden: Owner role required' }),
      })
      globalThis.fetch = mockFetch

      const ownerService = new OwnerAiService()
      await expect(
        ownerService.sendMessage('Show company revenues', 'non-owner-customer-token'),
      ).rejects.toThrow(/Forbidden/i)
    })

    it('denies execution when token is completely missing', async () => {
      const ownerService = new OwnerAiService()
      await expect(ownerService.sendMessage('Show company revenues')).rejects.toThrow(
        /Owner authorization token required/i,
      )
    })
  })

  describe('2. Sensitive Action Workflow (Owner Confirmation)', () => {
    it('detects sensitive refund request and enforces requiresOwnerConfirmation', () => {
      const refundDetection = detectSensitiveAction('Issue a full refund of £150 to Customer #42')
      expect(refundDetection.isSensitive).toBe(true)
      expect(refundDetection.actionType).toBe('refund')
    })

    it('detects account suspension request and marks as sensitive', () => {
      const suspendDetection = detectSensitiveAction('Suspend tradesperson account for safety violations')
      expect(suspendDetection.isSensitive).toBe(true)
      expect(suspendDetection.actionType).toBe('suspend_account')
    })

    it('detects record deletion / purge request and marks as sensitive', () => {
      const deleteDetection = detectSensitiveAction('Delete all job records from last week')
      expect(deleteDetection.isSensitive).toBe(true)
      expect(deleteDetection.actionType).toBe('delete_record')
    })

    it('permits non-sensitive informational queries without sensitive flagging', () => {
      const infoDetection = detectSensitiveAction('Summarize the top 5 trade categories requested this week')
      expect(infoDetection.isSensitive).toBe(false)
      expect(infoDetection.actionType).toBeUndefined()
    })

    it('records an explicitly confirmed proposal without executing it', async () => {
      const ownerService = new OwnerAiService()
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          executed: false,
          auditLogId: 'audit-log-12345',
          message: 'Proposal confirmed and logged. No business action was executed.',
        }),
      })
      globalThis.fetch = mockFetch

      const result = await ownerService.confirmAndLogProposal(
        {
          id: 'prop-1',
          proposalId: 'prop-1',
          actionType: 'refund',
          description: 'Refund £150 to Customer #42',
          parameters: { customerId: '42', amount: 150 },
          requiresOwnerConfirmation: true,
          status: 'pending_confirmation',
          createdAt: new Date().toISOString(),
        },
        'valid-owner-token',
      )

      expect(result.success).toBe(true)
      expect(result.executed).toBe(false)
      expect(result.message).toContain('No business action was executed')
      expect(result.auditLogId).toBe('audit-log-12345')
      expect(mockFetch).toHaveBeenCalledWith(
        '/functions/v1/buildrush-owner-ai',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })

    it('loads owner dashboard metrics from the authenticated server endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ metrics: { openJobsCount: 0, stripeMonthlyRevenueGbp: null } }),
      })
      globalThis.fetch = mockFetch
      const ownerService = new OwnerAiService()

      await expect(ownerService.getDashboard('valid-owner-token')).resolves.toEqual({
        openJobsCount: 0,
        stripeMonthlyRevenueGbp: null,
      })
      expect(mockFetch).toHaveBeenCalledWith(
        '/functions/v1/buildrush-owner-ai',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: expect.any(String) }),
          body: JSON.stringify({ action: 'get_dashboard' }),
        }),
      )
    })
  })

  describe('3. Core Brain Policy Boundary (Contingency Rule)', () => {
    it('identifies the £50 contingency rule as strictly owner-only', () => {
      expect(isOwnerOnlyRule('contingency_rule')).toBe(true)
    })

    it('excludes owner-only contingency rule from public knowledge', () => {
      const ownerRules = getOwnerOnlyRules()
      expect(ownerRules.some((r) => r.key === 'contingency_rule')).toBe(true)
      const contingencyRule = ownerRules.find((r) => r.key === 'contingency_rule')
      expect(contingencyRule?.value).toContain('£50 contingency')
      expect(contingencyRule?.value).toContain('NEVER advertised or automated')
    })
  })
})
