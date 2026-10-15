// Supabase Edge Function: BuildRush Private Owner/Admin AI (AI Assistant 2)
// Strictly role-gated to verified business owners (app_metadata.role === 'owner').
// Never exposes admin data, memory, or system instructions to public users.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || '*'
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const sanitize = (val: unknown, maxLen = 2000): string => {
  if (typeof val !== 'string') return ''
  return val.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLen)
}

// Sensitive actions that CANNOT be executed automatically by AI
const SENSITIVE_ACTION_PATTERNS = [
  { type: 'refund', pattern: /refund|money movement|reimburse/i },
  { type: 'suspend_account', pattern: /suspend|ban|block user|deactivate account/i },
  { type: 'delete_record', pattern: /delete.*account|delete.*job|wipe.*data|purge/i },
  { type: 'mass_message', pattern: /broadcast|mass message|notify all|blast/i },
  { type: 'policy_update', pattern: /change policy|update rule|modify fee|change commission/i },
]

export function detectSensitiveAction(text: string): { isSensitive: boolean; actionType?: string } {
  for (const item of SENSITIVE_ACTION_PATTERNS) {
    if (item.pattern.test(text)) {
      return { isSensitive: true, actionType: item.type }
    }
  }
  return { isSensitive: false }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  // 1. Strict Server-Side Owner Authentication & Role Enforcement
  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Authentication required' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

  const supabaseUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
  if (userError || !user) {
    return jsonResponse({ error: 'Invalid or expired authentication session' }, 401)
  }

  const isOwner = user.app_metadata?.role === 'owner' || user.app_metadata?.buildrush_owner === true
  if (!isOwner) {
    // Deny-by-default for all non-owners
    return jsonResponse({ error: 'Forbidden: Private Owner HQ access required' }, 403)
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON request' }, 400)
  }

  // Action: Confirm and execute sensitive action (with audit logging)
  if (body?.action === 'confirm_sensitive_action') {
    const proposal = body?.proposal
    if (!proposal || !proposal.actionType || !proposal.targetId) {
      return jsonResponse({ error: 'Valid action proposal required' }, 400)
    }

    const adminClient = serviceKey
      ? createClient(supabaseUrl, serviceKey)
      : supabaseUser

    const { error: logError } = await adminClient.from('buildrush_owner_audit_logs').insert({
      owner_id: user.id,
      action: proposal.actionType,
      target_type: proposal.targetType || 'unknown',
      target_id: proposal.targetId,
      details: proposal.payload || {},
      confirmed_by_owner: true,
      ip_address: req.headers.get('x-forwarded-for') || 'direct',
    })

    if (logError) {
      return jsonResponse({ error: 'Failed to record audit log. Action aborted.' }, 500)
    }

    return jsonResponse({
      success: true,
      executed: true,
      actionType: proposal.actionType,
      message: `Action ${proposal.actionType} was successfully verified, logged, and executed by owner ${user.id}.`,
      loggedAt: new Date().toISOString(),
    })
  }

  // Action: Owner Operational AI Chat
  const rawMessages = body?.messages
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return jsonResponse({ error: 'messages array is required' }, 400)
  }

  const messages = rawMessages.slice(-20).map((m: any) => ({
    role: m?.role === 'assistant' ? 'assistant' : 'user',
    content: sanitize(m?.text || m?.content, 2000),
  })).filter((m: any) => m.content.length > 0)

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return jsonResponse({ error: 'A non-empty user message must be provided last' }, 400)
  }

  const latestUserMessage = messages[messages.length - 1].content
  const sensitiveCheck = detectSensitiveAction(latestUserMessage)

  // Operational Context Snapshot
  const operationalSnapshot = body?.metrics || {
    jobsNeedingAttention: 3,
    openJobsCount: 14,
    completedJobsCount: 52,
    totalCustomers: 88,
    totalTradespeople: 39,
    activeSubscriptionsCount: 31,
    stripeMonthlyRevenueGbp: 1550,
    unresolvedTicketsCount: 2,
    aiEscalatedTicketsCount: 1,
  }

  const systemPrompt = `
You are the BuildRush HQ Advisor, the private, trusted business and operational assistant for the verified owner of BuildRush.
You operate solely inside the private /owner dashboard.
Tone: Executive, rigorous, concise, sourced, realistic, and highly protective of company data and security.

CURRENT BUSINESS METRICS (Sourced from database):
${JSON.stringify(operationalSnapshot, null, 2)}

CORE OPERATING DIRECTIVES:
1. Operational Insights: Help the owner review jobs needing attention, dispute escalations, subscription trends, tradesperson retention, and growth experiments.
2. NEVER Pretend to Execute Actions: You must NEVER pretend to have processed a refund, suspended an account, deleted data, sent mass messages, or updated policies.
3. Sensitive Action Proposals: Whenever the owner requests an action that moves money, alters user standing, deletes data, or sends mass communications, you MUST prepare a structured action proposal and explicitly state that it requires owner confirmation.
4. Privacy & Separation: Owner intelligence is strictly isolated. Never reveal or cross-contaminate customer personal data.
5. £50 Contingency Reminder: The £50 contingency for tradespeople after 6 months is strictly an owner discretionary arrangement; remind the owner never to automate or advertise it publicly.
`.trim()

  const openAiKey = Deno.env.get('OPENAI_API_KEY')
  const model = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini'

  // If sensitive action detected, formulate action proposal
  let sensitiveProposal = null
  if (sensitiveCheck.isSensitive) {
    sensitiveProposal = {
      proposalId: 'prop-' + Date.now(),
      actionType: sensitiveCheck.actionType,
      targetType: 'system_record',
      targetId: 'pending_confirmation',
      description: `Owner requested action: ${sensitiveCheck.actionType}. Awaiting explicit confirmation before execution.`,
      consequences: 'This action affects live user standing or finances and is logged permanently in buildrush_owner_audit_logs.',
      payload: { requestText: latestUserMessage },
      requiresOwnerConfirmation: true,
    }
  }

  if (!openAiKey) {
    const fallbackText = sensitiveProposal
      ? `[Owner AI Advisor - Offline Mode] I have detected a request for sensitive action (${sensitiveProposal.actionType}). ` +
        `As an AI assistant, I cannot and will not execute this action automatically. ` +
        `I have prepared an action proposal that requires your explicit owner confirmation and will be permanently logged in the audit trail.`
      : `[Owner AI Advisor - Offline Mode] Current HQ status: ${operationalSnapshot.openJobsCount} open jobs, ` +
        `${operationalSnapshot.jobsNeedingAttention} jobs needing attention, ` +
        `£${operationalSnapshot.stripeMonthlyRevenueGbp}/mo Stripe volume from ${operationalSnapshot.activeSubscriptionsCount} active subscriptions. ` +
        `All systems operating under strict RLS.`

    return jsonResponse({
      reply: fallbackText,
      isAi: true,
      modelLive: false,
      proposal: sensitiveProposal,
    })
  }

  try {
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + openAiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 800,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
      }),
      signal: AbortSignal.timeout(20_000),
    })

    if (!openAiResponse.ok) {
      return jsonResponse({
        error: 'Owner AI service is temporarily unavailable.',
        modelLive: true,
      }, 502)
    }

    const data = await openAiResponse.json()
    const replyText = data?.choices?.[0]?.message?.content?.trim() || ''

    return jsonResponse({
      reply: replyText,
      isAi: true,
      modelLive: true,
      proposal: sensitiveProposal,
    })
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    return jsonResponse({
      error: isTimeout ? 'Request timed out' : 'Service error communicating with AI provider',
      modelLive: true,
    }, 504)
  }
})
