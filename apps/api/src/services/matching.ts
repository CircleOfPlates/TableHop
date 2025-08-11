import { db } from '../db/client'
import { participants, users, events, dinnerGroups } from '../db/schema'
import { eq, and, inArray, sql } from 'drizzle-orm'

interface ParticipantWithProfile {
  id: number
  userId: number
  coursePreference: string | null
  courseAssigned: string | null
  isHost: boolean
  user: {
    id: number
    name: string | null
    interests: string[] | null
    personalityType: string | null
    cookingExperience: string | null
    dietaryRestrictions: string | null
    preferredGroupSize: string | null
    socialPreferences: string[] | null
  }
}

interface MatchingResult {
  groupId: number
  participants: ParticipantWithProfile[]
  starterHost: ParticipantWithProfile | null
  mainHost: ParticipantWithProfile | null
  dessertHost: ParticipantWithProfile | null
}

export class MatchingService {
  /**
   * Match participants for a rotating dinner event
   */
  static async matchRotatingDinner(eventId: number): Promise<MatchingResult[]> {
    // Get all participants for the event
    const eventParticipants = await db.select({
      id: participants.id,
      userId: participants.userId,
      coursePreference: participants.coursePreference,
      courseAssigned: participants.courseAssigned,
      isHost: participants.isHost,
      user: {
        id: users.id,
        name: users.name,
        interests: users.interests,
        personalityType: users.personalityType,
        cookingExperience: users.cookingExperience,
        dietaryRestrictions: users.dietaryRestrictions,
        preferredGroupSize: users.preferredGroupSize,
        socialPreferences: users.socialPreferences,
      }
    }).from(participants)
    .innerJoin(users, eq(participants.userId, users.id))
    .where(eq(participants.eventId, eventId))

    if (eventParticipants.length < 6) {
      throw new Error('Need at least 6 participants for rotating dinner')
    }

    // Group participants by course preference
    const starterParticipants = eventParticipants.filter(p => p.coursePreference === 'starter')
    const mainParticipants = eventParticipants.filter(p => p.coursePreference === 'main')
    const dessertParticipants = eventParticipants.filter(p => p.coursePreference === 'dessert')

    // Ensure we have at least 2 participants for each course
    if (starterParticipants.length < 2 || mainParticipants.length < 2 || dessertParticipants.length < 2) {
      throw new Error('Need at least 2 participants for each course type')
    }

    // Create dinner groups
    const groups: MatchingResult[] = []
    const maxGroups = Math.min(
      starterParticipants.length,
      mainParticipants.length,
      dessertParticipants.length
    )

    for (let i = 0; i < maxGroups; i++) {
      const starterHost = starterParticipants[i]
      const mainHost = mainParticipants[i]
      const dessertHost = dessertParticipants[i]

      // Find compatible guests for each group
      const groupParticipants = await this.findCompatibleGuests(
        eventParticipants.filter(p => 
          p.id !== starterHost.id && 
          p.id !== mainHost.id && 
          p.id !== dessertHost.id
        ),
        [starterHost, mainHost, dessertHost],
        3 // 3 guests per group
      )

      // Create dinner group
      const [dinnerGroup] = await db.insert(dinnerGroups).values({
        eventId,
        name: `Group ${i + 1}`,
        starterParticipantId: starterHost.id,
        mainParticipantId: mainHost.id,
        dessertParticipantId: dessertHost.id,
      }).returning()

      // Update participants with course assignments
      await db.update(participants)
        .set({ courseAssigned: 'starter', isHost: true })
        .where(eq(participants.id, starterHost.id))

      await db.update(participants)
        .set({ courseAssigned: 'main', isHost: true })
        .where(eq(participants.id, mainHost.id))

      await db.update(participants)
        .set({ courseAssigned: 'dessert', isHost: true })
        .where(eq(participants.id, dessertHost.id))

      // Assign guests to courses
      for (let j = 0; j < groupParticipants.length; j++) {
        const course = ['starter', 'main', 'dessert'][j % 3]
        await db.update(participants)
          .set({ courseAssigned: course, isHost: false })
          .where(eq(participants.id, groupParticipants[j].id))
      }

      groups.push({
        groupId: dinnerGroup.id,
        participants: [starterHost, mainHost, dessertHost, ...groupParticipants],
        starterHost,
        mainHost,
        dessertHost,
      })
    }

    return groups
  }

  /**
   * Match participants for a hosted dinner event
   */
  static async matchHostedDinner(eventId: number): Promise<MatchingResult[]> {
    const eventParticipants = await db.select({
      id: participants.id,
      userId: participants.userId,
      coursePreference: participants.coursePreference,
      courseAssigned: participants.courseAssigned,
      isHost: participants.isHost,
      user: {
        id: users.id,
        name: users.name,
        interests: users.interests,
        personalityType: users.personalityType,
        cookingExperience: users.cookingExperience,
        dietaryRestrictions: users.dietaryRestrictions,
        preferredGroupSize: users.preferredGroupSize,
        socialPreferences: users.socialPreferences,
      }
    }).from(participants)
    .innerJoin(users, eq(participants.userId, users.id))
    .where(eq(participants.eventId, eventId))

    if (eventParticipants.length < 4) {
      throw new Error('Need at least 4 participants for hosted dinner')
    }

    // Select hosts based on cooking experience and personality
    const potentialHosts = eventParticipants.filter(p => 
      p.user.cookingExperience === 'advanced' || p.user.cookingExperience === 'intermediate'
    )

    if (potentialHosts.length === 0) {
      // If no advanced cooks, select based on personality
      const extrovertedParticipants = eventParticipants.filter(p => 
        p.user.personalityType === 'extrovert'
      )
      if (extrovertedParticipants.length > 0) {
        potentialHosts.push(...extrovertedParticipants)
      } else {
        potentialHosts.push(...eventParticipants)
      }
    }

    // Create groups with one host per group
    const groups: MatchingResult[] = []
    const maxGroups = Math.min(potentialHosts.length, Math.floor(eventParticipants.length / 4))

    for (let i = 0; i < maxGroups; i++) {
      const host = potentialHosts[i]
      
      // Find compatible guests
      const guests = await this.findCompatibleGuests(
        eventParticipants.filter(p => p.id !== host.id),
        [host],
        6 // Up to 6 guests per hosted dinner
      )

      // Create dinner group
      const [dinnerGroup] = await db.insert(dinnerGroups).values({
        eventId,
        name: `Hosted Group ${i + 1}`,
        starterParticipantId: host.id, // Host handles all courses
        mainParticipantId: null,
        dessertParticipantId: null,
      }).returning()

      // Update host assignment
      await db.update(participants)
        .set({ courseAssigned: 'hosted', isHost: true })
        .where(eq(participants.id, host.id))

      // Update guest assignments
      for (const guest of guests) {
        await db.update(participants)
          .set({ courseAssigned: 'guest', isHost: false })
          .where(eq(participants.id, guest.id))
      }

      groups.push({
        groupId: dinnerGroup.id,
        participants: [host, ...guests],
        starterHost: host,
        mainHost: null,
        dessertHost: null,
      })
    }

    return groups
  }

  /**
   * Find compatible guests based on interests, personality, and preferences
   */
  private static async findCompatibleGuests(
    availableParticipants: ParticipantWithProfile[],
    hosts: ParticipantWithProfile[],
    maxGuests: number
  ): Promise<ParticipantWithProfile[]> {
    const selectedGuests: ParticipantWithProfile[] = []
    const usedParticipants = new Set<number>()

    // Add hosts to used set
    hosts.forEach(host => usedParticipants.add(host.id))

    // Score each available participant based on compatibility
    const scoredParticipants = availableParticipants
      .filter(p => !usedParticipants.has(p.id))
      .map(participant => ({
        participant,
        score: this.calculateCompatibilityScore(participant, hosts)
      }))
      .sort((a, b) => b.score - a.score)

    // Select top-scoring participants
    for (let i = 0; i < Math.min(maxGuests, scoredParticipants.length); i++) {
      const { participant } = scoredParticipants[i]
      selectedGuests.push(participant)
      usedParticipants.add(participant.id)
    }

    return selectedGuests
  }

  /**
   * Calculate compatibility score between a participant and hosts
   */
  private static calculateCompatibilityScore(
    participant: ParticipantWithProfile,
    hosts: ParticipantWithProfile[]
  ): number {
    let score = 0

    for (const host of hosts) {
      // Interest compatibility (30% weight)
      if (participant.user.interests && host.user.interests) {
        const commonInterests = participant.user.interests.filter(interest => 
          host.user.interests!.includes(interest)
        )
        score += (commonInterests.length / Math.max(participant.user.interests.length, host.user.interests.length)) * 30
      }

      // Personality compatibility (25% weight)
      if (participant.user.personalityType && host.user.personalityType) {
        if (participant.user.personalityType === host.user.personalityType) {
          score += 25 // Same personality type
        } else if (
          (participant.user.personalityType === 'extrovert' && host.user.personalityType === 'ambivert') ||
          (participant.user.personalityType === 'ambivert' && host.user.personalityType === 'extrovert') ||
          (participant.user.personalityType === 'introvert' && host.user.personalityType === 'ambivert') ||
          (participant.user.personalityType === 'ambivert' && host.user.personalityType === 'introvert')
        ) {
          score += 20 // Compatible personality types
        } else {
          score += 10 // Different personality types (still compatible)
        }
      }

      // Social preferences compatibility (20% weight)
      if (participant.user.socialPreferences && host.user.socialPreferences) {
        const commonPreferences = participant.user.socialPreferences.filter(pref => 
          host.user.socialPreferences!.includes(pref)
        )
        score += (commonPreferences.length / Math.max(participant.user.socialPreferences.length, host.user.socialPreferences.length)) * 20
      }

      // Dietary compatibility (15% weight)
      if (participant.user.dietaryRestrictions && host.user.dietaryRestrictions) {
        if (participant.user.dietaryRestrictions === host.user.dietaryRestrictions) {
          score += 15 // Same dietary restrictions
        } else if (
          participant.user.dietaryRestrictions.includes('vegetarian') && 
          host.user.dietaryRestrictions.includes('vegetarian')
        ) {
          score += 10 // Compatible dietary restrictions
        } else {
          score += 5 // Different but manageable
        }
      }

      // Cooking experience balance (10% weight)
      if (participant.user.cookingExperience && host.user.cookingExperience) {
        const experienceLevels = ['beginner', 'intermediate', 'advanced']
        const participantLevel = experienceLevels.indexOf(participant.user.cookingExperience)
        const hostLevel = experienceLevels.indexOf(host.user.cookingExperience)
        
        if (Math.abs(participantLevel - hostLevel) <= 1) {
          score += 10 // Similar experience levels
        } else {
          score += 5 // Different experience levels (can be complementary)
        }
      }
    }

    return score / hosts.length // Average score across all hosts
  }

  /**
   * Trigger matching for a specific event
   */
  static async triggerMatching(eventId: number): Promise<MatchingResult[]> {
    // Get event details
    const [event] = await db.select().from(events).where(eq(events.id, eventId))
    if (!event) {
      throw new Error('Event not found')
    }

    // Check if matching has already been done
    const existingGroups = await db.select().from(dinnerGroups).where(eq(dinnerGroups.eventId, eventId))
    if (existingGroups.length > 0) {
      throw new Error('Matching has already been completed for this event')
    }

    // Perform matching based on event format
    if (event.format === 'rotating') {
      return await this.matchRotatingDinner(eventId)
    } else {
      return await this.matchHostedDinner(eventId)
    }
  }

  /**
   * Get matching results for an event
   */
  static async getMatchingResults(eventId: number): Promise<MatchingResult[]> {
    const groups = await db.select({
      id: dinnerGroups.id,
      name: dinnerGroups.name,
      starterParticipantId: dinnerGroups.starterParticipantId,
      mainParticipantId: dinnerGroups.mainParticipantId,
      dessertParticipantId: dinnerGroups.dessertParticipantId,
    }).from(dinnerGroups)
    .where(eq(dinnerGroups.eventId, eventId))

    const results: MatchingResult[] = []

    for (const group of groups) {
      const groupParticipants = await db.select({
        id: participants.id,
        userId: participants.userId,
        coursePreference: participants.coursePreference,
        courseAssigned: participants.courseAssigned,
        isHost: participants.isHost,
        user: {
          id: users.id,
          name: users.name,
          interests: users.interests,
          personalityType: users.personalityType,
          cookingExperience: users.cookingExperience,
          dietaryRestrictions: users.dietaryRestrictions,
          preferredGroupSize: users.preferredGroupSize,
          socialPreferences: users.socialPreferences,
        }
      }).from(participants)
      .innerJoin(users, eq(participants.userId, users.id))
      .where(inArray(participants.id, [
        group.starterParticipantId,
        group.mainParticipantId,
        group.dessertParticipantId
      ].filter(Boolean) as number[]))

      const starterHost = groupParticipants.find((p: any) => p.id === group.starterParticipantId) || null
      const mainHost = groupParticipants.find((p: any) => p.id === group.mainParticipantId) || null
      const dessertHost = groupParticipants.find((p: any) => p.id === group.dessertParticipantId) || null

      results.push({
        groupId: group.id,
        participants: groupParticipants,
        starterHost,
        mainHost,
        dessertHost,
      })
    }

    return results
  }
}
