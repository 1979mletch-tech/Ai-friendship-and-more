import { describe, expect, it } from 'vitest'
import { isCrisisText, isDependencyRiskText, isPromptInjectionText } from './safety'
import { safetyRegressionCorpus } from './safetyCorpus'

describe('safety regression corpus', () => {
  for (const scenario of safetyRegressionCorpus) {
    it(scenario.text, () => {
      const actual = isCrisisText(scenario.text) ? 'crisis'
        : isDependencyRiskText(scenario.text) ? 'dependency'
        : isPromptInjectionText(scenario.text) ? 'injection'
        : 'normal'
      expect(actual).toBe(scenario.expected)
    })
  }
})
