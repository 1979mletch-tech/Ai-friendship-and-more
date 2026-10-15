// BuildRush Domain Models and System Interfaces

export type UserRole = 'customer' | 'tradesperson' | 'owner'

export interface BuildRushProfile {
  id: string
  userId: string
  role: UserRole
  fullName: string
  phone?: string
  trade?: string
  postcode?: string
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export type TradeCategory =
  | 'plumbing'
  | 'electrical'
  | 'roofing'
  | 'carpentry'
  | 'heating'
  | 'painting'
  | 'locksmith'
  | 'general'

export type JobUrgency = 'today' | 'tomorrow' | 'within_48h' | 'flexible'
export type JobStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'

export interface BuildRushJob {
  id: string
  customerId: string
  title: string
  trade: string
  description: string
  budgetMin?: number
  budgetMax?: number
  postcode: string
  urgency: JobUrgency
  status: JobStatus
  bidCount?: number
  createdAt: string
  updatedAt: string
}

export type Job = BuildRushJob

export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

export interface BuildRushBid {
  id: string
  jobId: string
  tradespersonId: string
  proposedPrice: number
  message: string
  estimatedDuration?: string
  status: BidStatus
  createdAt: string
  updatedAt: string
}

export type SubscriptionTier = 'starter' | 'pro' | 'unlimited'
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled'

export interface BuildRushSubscription {
  id: string
  userId: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  currentPeriodEnd?: string
}

export type TicketPriority = 'low' | 'normal' | 'urgent'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface BuildRushSupportTicket {
  id: string
  userId: string
  subject: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  escalatedByAi: boolean
  createdAt: string
  updatedAt: string
}

// Layer 1: Core Business Brain
export type CoreKnowledgeCategory =
  | 'operating_rules'
  | 'uk_pricing'
  | 'company_policy'
  | 'assistant_identity'
  | 'contingency_rule'

export interface CoreKnowledgeItem {
  id: string
  category: CoreKnowledgeCategory
  key: string
  value: Record<string, unknown>
  isActive: boolean
  updatedBy: string
  updatedAt: string
}

// Layer 2: Active Working Memory
export type AssistantType = 'customer' | 'owner'
export type MessageRole = 'user' | 'assistant' | 'system'

export interface AiMessage {
  id: string
  role: MessageRole
  text: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface AiConversation {
  id: string
  userId: string
  assistantType: AssistantType
  title: string
  isArchived: boolean
  messages: AiMessage[]
  createdAt: string
  updatedAt: string
}

// Monthly Working Archives
export interface MonthlyArchive {
  id: string
  monthKey: string // 'YYYY-MM'
  assistantType: AssistantType
  summary: string
  openCases: Array<{ id: string; subject: string; status: string; priority: string }>
  keyDecisions: Array<{ id: string; decision: string; date: string; rationale: string }>
  archivedRoutineCount: number
  createdAt: string
}

// Owner Audit Trail for Sensitive Actions
export interface OwnerAuditLog {
  id: string
  ownerId: string
  action: string
  targetType: string
  targetId: string
  details: Record<string, unknown>
  confirmedByOwner: boolean
  ipAddress?: string
  createdAt: string
}

// Sensitive action proposal prepared by Owner AI (requiring explicit owner confirmation)
export interface SensitiveActionProposal {
  proposalId: string
  actionType: 'refund' | 'suspend_account' | 'delete_record' | 'mass_message' | 'policy_update'
  targetType: string
  targetId: string
  description: string
  consequences: string
  payload: Record<string, unknown>
  requiresOwnerConfirmation: true
}

// Live Operational Dashboard Metrics for Private Owner HQ
export interface OwnerOperationalMetrics {
  jobsNeedingAttention: number
  openJobsCount: number
  completedJobsCount: number
  totalCustomers: number
  totalTradespeople: number
  activeSubscriptionsCount: number
  stripeMonthlyRevenueGbp: number
  unresolvedTicketsCount: number
  aiEscalatedTicketsCount: number
  customerAiStatus: 'operational' | 'degraded' | 'offline'
  ownerAiStatus: 'operational' | 'degraded' | 'offline'
  lastMonthlyArchive: string
}
