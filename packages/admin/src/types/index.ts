export type Election = {
id: string
name: string
startAt: string
endAt: string
status: 'draft' | 'scheduled' | 'open' | 'closed'
totalVoters: number
emittedVotes: number
participation: number // 0..1
}


export type Candidate = {
id: string
electionId: string
name: string
party?: string
photo?: string
description?: string
profile?: {
  education: string[]
  experience: string[]
  achievements: string[]
}
trajectory?: {
  positions: Array<{
    title: string
    organization: string
    period: string
    description?: string
  }>
  politicalExperience: Array<{
    role: string
    party: string
    period: string
    description?: string
  }>
}
projects?: Array<{
  title: string
  category: 'economic' | 'social' | 'infrastructure' | 'education' | 'health' | 'environment' | 'security' | 'other'
  description: string
  objectives: string[]
  timeline?: string
  budget?: string
}>
contactInfo?: {
  website?: string
  email?: string
  phone?: string
  socialMedia?: {
    twitter?: string
    facebook?: string
    instagram?: string
  }
}
createdAt: string
updatedAt: string
}


export type RealtimeTick = {
ts: number
votesPerMinute: number
participation: number // 0..1
queue: number
}


export type AuditLog = {
id: string
ts: number
type: 'INFO' | 'WARN' | 'ERROR'
actor: string
message: string
}