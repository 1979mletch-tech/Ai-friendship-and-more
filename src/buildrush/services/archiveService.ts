// BuildRush Monthly Archive Rollover & Working Memory Service
// Strictly for Owner HQ authorized operational management.

import type { MonthlyArchive } from '../types'

export interface ArchiveRolloverRequest {
  yearMonth: string // e.g. "2026-09"
  dryRun?: boolean
}

export interface ArchiveRolloverResult {
  success: boolean
  archive: MonthlyArchive
  archivedRecordsCount: number
  retainedOpenCasesCount: number
  message: string
}

export class ArchiveService {
  private endpointUrl: string

  constructor(endpointUrl = '/functions/v1/buildrush-archive') {
    this.endpointUrl = endpointUrl
  }

  /**
   * Triggers the end-of-month archive rollover for a given year and month.
   * Generates summary, archives routine records, retains open cases & Layer 1 knowledge.
   */
  public async triggerRollover(
    req: ArchiveRolloverRequest,
    authToken: string,
  ): Promise<ArchiveRolloverResult> {
    if (!authToken) {
      throw new Error('Owner authorization required to trigger monthly archive rollover.')
    }

    const response = await fetch(this.endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + authToken,
      },
      body: JSON.stringify({
        action: 'rollover',
        yearMonth: req.yearMonth,
        dryRun: Boolean(req.dryRun),
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to trigger archive rollover (status ' + response.status + ')')
    }

    return (await response.json()) as ArchiveRolloverResult
  }

  /**
   * Loads all historical monthly archives for search and retrieval in Owner HQ.
   */
  public async listArchives(authToken: string): Promise<MonthlyArchive[]> {
    if (!authToken) {
      throw new Error('Owner authorization required to view monthly archives.')
    }

    const response = await fetch(this.endpointUrl + '?action=list', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + authToken,
      },
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to list archives (status ' + response.status + ')')
    }

    const data = await response.json()
    return (data.archives || []) as MonthlyArchive[]
  }
}

export const archiveService = new ArchiveService()
