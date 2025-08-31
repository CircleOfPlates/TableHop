import { db } from '../db/client'
import { matchingPool, circles, circleMembers, users, events } from '../db/schema'
import { eq, and, inArray, sql, desc } from 'drizzle-orm'
import { MATCHING_CONFIG, CIRCLE_FORMAT, CIRCLE_ROLES, EVENT_STATUS } from '../config/constants'

interface OptInUser {
  id: number
  userId: number
  partnerId: number | null
  matchAddress: string | null
  hostingAvailable: boolean
  user: {
    id: number
    name: string | null
    interests: string[] | null
    personalityType: string | null
    cookingExperience: string | null
    dietaryRestrictions: string | null
    socialPreferences: string[] | null
  }
  partner?: {
    id: number
    name: string | null
    interests: string[] | null
    personalityType: string | null
    cookingExperience: string | null
    dietaryRestrictions: string | null
    socialPreferences: string[] | null
  }
}

interface Circle {
  id: number
  name: string
  format: string
  members: {
    id: number
    userId: number
    role: string
    user: {
      id: number
      name: string | null
      interests: string[] | null
      personalityType: string | null
      cookingExperience: string | null
      dietaryRestrictions: string | null
      socialPreferences: string[] | null
    }
  }[]
}

export class MatchingService {
  /**
   * Trigger matching for a specific event
   */
  static async triggerMatching(eventId: number): Promise<Circle[]> {
    // Get event details
    const [event] = await db.select().from(events).where(eq(events.id, eventId))
    if (!event) {
      throw new Error('Event not found')
    }

    // Check if matching has already been done
    const existingCircles = await db.select().from(circles).where(eq(circles.eventId, eventId))
    if (existingCircles.length > 0) {
      throw new Error('Matching has already been completed for this event')
    }

    // Get all opt-ins for this event
    const optIns = await db.select({
      id: matchingPool.id,
      userId: matchingPool.userId,
      partnerId: matchingPool.partnerId,
      matchAddress: matchingPool.matchAddress,
      hostingAvailable: matchingPool.hostingAvailable,
      user: {
        id: users.id,
        name: users.name,
        interests: users.interests,
        personalityType: users.personalityType,
        cookingExperience: users.cookingExperience,
        dietaryRestrictions: users.dietaryRestrictions,
        socialPreferences: users.socialPreferences,
      }
    }).from(matchingPool)
    .innerJoin(users, eq(matchingPool.userId, users.id))
    .where(eq(matchingPool.eventId, eventId))

    if (optIns.length < MATCHING_CONFIG.DEFAULT_CIRCLE_SIZE) {
      throw new Error(`Need at least ${MATCHING_CONFIG.DEFAULT_CIRCLE_SIZE} opt-ins to start matching`)
    }

    // Get partner information for partnered users
    const optInsWithPartners = await Promise.all(
      optIns.map(async (optIn) => {
        if (optIn.partnerId) {
          const partner = await db.select({
            id: users.id,
            name: users.name,
            interests: users.interests,
            personalityType: users.personalityType,
            cookingExperience: users.cookingExperience,
            dietaryRestrictions: users.dietaryRestrictions,
            socialPreferences: users.socialPreferences,
          }).from(users).where(eq(users.id, optIn.partnerId)).then(res => res[0])
          
          return { ...optIn, partner }
        }
        return optIn
      })
    )

    // Perform matching
    const resultCircles = await this.performMatching(optInsWithPartners, eventId)

    // Update event status
    await db.update(events)
      .set({ 
        matchingStatus: EVENT_STATUS.CLOSED,
        matchingCompletedAt: new Date()
      })
      .where(eq(events.id, eventId))

    return resultCircles
  }

  /**
   * Perform the actual matching algorithm
   */
  private static async performMatching(optIns: OptInUser[], eventId: number): Promise<Circle[]> {
    const resultCircles: Circle[] = []
    const usedUsers = new Set<number>()
    
    // Separate partnered and single users
    const partneredUsers = optIns.filter(optIn => optIn.partnerId)
    const singleUsers = optIns.filter(optIn => !optIn.partnerId)

    // Calculate target number of rotating vs hosted circles
    const totalUsers = optIns.length
    const targetRotatingCircles = Math.floor(partneredUsers.length / MATCHING_CONFIG.DEFAULT_CIRCLE_SIZE)
    const targetHostedCircles = Math.ceil(totalUsers / MATCHING_CONFIG.DEFAULT_CIRCLE_SIZE) - targetRotatingCircles
    
    // Create rotating circles first (partnered users only)
    const rotatingCircles = await this.createRotatingCircles(partneredUsers, eventId, usedUsers)
    resultCircles.push(...rotatingCircles)

    // Create hosted circles with remaining users (both partnered and single)
    const remainingUsers = optIns.filter(optIn => !usedUsers.has(optIn.userId))
    const hostedCircles = await this.createHostedCircles(remainingUsers, eventId, usedUsers)
    resultCircles.push(...hostedCircles)

    // Handle any remaining users by creating smaller circles or adding to existing ones
    const finalRemainingUsers = optIns.filter(optIn => !usedUsers.has(optIn.userId))
    if (finalRemainingUsers.length > 0) {
      const incompleteCircles = await this.handleIncompleteCircles(finalRemainingUsers, eventId, usedUsers)
      resultCircles.push(...incompleteCircles)
    }

    return resultCircles
  }

  /**
   * Create rotating dinner circles (partnered users only)
   */
  private static async createRotatingCircles(
    partneredUsers: OptInUser[], 
    eventId: number, 
    usedUsers: Set<number>
  ): Promise<Circle[]> {
    const resultCircles: Circle[] = []
    
    // Only partnered users can be in rotating circles
    const availablePartners = partneredUsers.filter(optIn => !usedUsers.has(optIn.userId))
    
    // Create as many rotating circles as possible with partnered users
    while (availablePartners.length >= MATCHING_CONFIG.DEFAULT_CIRCLE_SIZE) {
      const membersToAdd: OptInUser[] = []
      
      // Add partnered users to this circle
      for (let i = 0; i < MATCHING_CONFIG.DEFAULT_CIRCLE_SIZE && availablePartners.length > 0; i++) {
        const partnered = availablePartners.shift()!
        membersToAdd.push(partnered)
        
        // Mark both user and partner as used
        usedUsers.add(partnered.userId)
        if (partnered.partnerId) {
          usedUsers.add(partnered.partnerId)
        }
      }
      
      // Create circle
      const [circle] = await db.insert(circles).values({
        eventId,
        name: `Rotating Circle ${resultCircles.length + 1}`,
        format: CIRCLE_FORMAT.ROTATING,
      }).returning()

      // Add members with course assignments
      const courseRoles = [CIRCLE_ROLES.STARTER, CIRCLE_ROLES.MAIN, CIRCLE_ROLES.DESSERT]
      for (let i = 0; i < membersToAdd.length; i++) {
        const member = membersToAdd[i]
        const role = courseRoles[i % 3] // Distribute courses evenly
        
        await db.insert(circleMembers).values({
          circleId: circle.id,
          userId: member.userId,
          role,
        })
      }

      // Get circle with members for response
      const circleWithMembers = await this.getCircleWithMembers(circle.id)
      resultCircles.push(circleWithMembers)
    }

    return resultCircles
  }

  /**
   * Create hosted dinner circles (can include both partnered and single users)
   */
  private static async createHostedCircles(
    remainingUsers: OptInUser[], 
    eventId: number, 
    usedUsers: Set<number>
  ): Promise<Circle[]> {
    const resultCircles: Circle[] = []
    
    // Filter out already used users
    const availableUsers = remainingUsers.filter(optIn => !usedUsers.has(optIn.userId))
    
    // Create hosted circles
    while (availableUsers.length >= MATCHING_CONFIG.DEFAULT_CIRCLE_SIZE) {
      const membersToAdd = availableUsers.splice(0, MATCHING_CONFIG.DEFAULT_CIRCLE_SIZE)
      
      // Select host using smart selection
      const host = this.selectHost(membersToAdd)
      const guests = membersToAdd.filter(member => member.userId !== host.userId)

      // Create circle
      const [circle] = await db.insert(circles).values({
        eventId,
        name: `Hosted Circle ${resultCircles.length + 1}`,
        format: CIRCLE_FORMAT.HOSTED,
      }).returning()

      // Add host
      await db.insert(circleMembers).values({
        circleId: circle.id,
        userId: host.userId,
        role: CIRCLE_ROLES.HOST,
      })
      usedUsers.add(host.userId)

      // Add guests
      for (const guest of guests) {
        await db.insert(circleMembers).values({
          circleId: circle.id,
          userId: guest.userId,
          role: CIRCLE_ROLES.PARTICIPANT,
        })
        usedUsers.add(guest.userId)
      }

      // Get circle with members for response
      const circleWithMembers = await this.getCircleWithMembers(circle.id)
      resultCircles.push(circleWithMembers)
    }

    return resultCircles
  }

  /**
   * Get circle with all its members
   */
  private static async getCircleWithMembers(circleId: number): Promise<Circle> {
    const [circle] = await db.select({
      id: circles.id,
      name: circles.name,
      format: circles.format,
    }).from(circles).where(eq(circles.id, circleId))

    const members = await db.select({
      id: circleMembers.id,
      userId: circleMembers.userId,
      role: circleMembers.role,
      user: {
        id: users.id,
        name: users.name,
        interests: users.interests,
        personalityType: users.personalityType,
        cookingExperience: users.cookingExperience,
        dietaryRestrictions: users.dietaryRestrictions,
        socialPreferences: users.socialPreferences,
      }
    }).from(circleMembers)
    .innerJoin(users, eq(circleMembers.userId, users.id))
    .where(eq(circleMembers.circleId, circleId))

    return {
      ...circle,
      members,
    }
  }

  /**
   * Smart host selection for hosted circles
   */
  private static selectHost(members: OptInUser[]): OptInUser {
    // Prioritize users who want to host and have partners in the same circle
    const potentialHosts = members
      .filter(m => m.hostingAvailable)
      .sort((a, b) => {
        const aHasPartnerInCircle = a.partnerId && members.some(m => m.userId === a.partnerId)
        const bHasPartnerInCircle = b.partnerId && members.some(m => m.userId === b.partnerId)
        
        if (aHasPartnerInCircle && !bHasPartnerInCircle) return -1
        if (!aHasPartnerInCircle && bHasPartnerInCircle) return 1
        
        // Then by cooking experience
        const aExp = this.getCookingExperienceScore(a.user.cookingExperience)
        const bExp = this.getCookingExperienceScore(b.user.cookingExperience)
        return bExp - aExp
      })
    
    return potentialHosts[0] || members[0]
  }

  /**
   * Get cooking experience score for host selection
   */
  private static getCookingExperienceScore(experience: string | null): number {
    switch (experience) {
      case 'advanced': return 3
      case 'intermediate': return 2
      case 'beginner': return 1
      default: return 0
    }
  }

  /**
   * Calculate compatibility score between two users
   */
  private static calculateCompatibility(user1: OptInUser, user2: OptInUser): number {
    let score = 0
    
    // Dietary compatibility
    if (user1.user.dietaryRestrictions === user2.user.dietaryRestrictions) {
      score += 3
    }
    
    // Interest overlap
    const commonInterests = user1.user.interests?.filter(i => 
      user2.user.interests?.includes(i)
    ).length || 0
    score += commonInterests * 2
    
    // Personality compatibility (basic scoring)
    if (user1.user.personalityType && user2.user.personalityType) {
      if (user1.user.personalityType === user2.user.personalityType) {
        score += 2
      }
    }
    
    return score
  }

  /**
   * Handle users who couldn't be placed in full circles
   */
  private static async handleIncompleteCircles(
    remainingUsers: OptInUser[], 
    eventId: number, 
    usedUsers: Set<number>
  ): Promise<Circle[]> {
    const resultCircles: Circle[] = []
    
    // Try to add remaining users to existing circles if they have space
    const existingCircles = await db.select().from(circles).where(eq(circles.eventId, eventId))
    
    for (const circle of existingCircles) {
      const currentMembers = await db.select().from(circleMembers).where(eq(circleMembers.circleId, circle.id))
      
      if (currentMembers.length < MATCHING_CONFIG.DEFAULT_CIRCLE_SIZE && remainingUsers.length > 0) {
        const spaceAvailable = MATCHING_CONFIG.DEFAULT_CIRCLE_SIZE - currentMembers.length
        const usersToAdd = remainingUsers.splice(0, spaceAvailable)
        
        for (const user of usersToAdd) {
          await db.insert(circleMembers).values({
            circleId: circle.id,
            userId: user.userId,
            role: circle.format === CIRCLE_FORMAT.ROTATING ? 
              [CIRCLE_ROLES.STARTER, CIRCLE_ROLES.MAIN, CIRCLE_ROLES.DESSERT][currentMembers.length % 3] :
              CIRCLE_ROLES.PARTICIPANT
          })
          usedUsers.add(user.userId)
        }
      }
    }
    
    // Create a small circle for any remaining users (minimum 4 people)
    if (remainingUsers.length >= 4) {
      const [circle] = await db.insert(circles).values({
        eventId,
        name: `Small Circle ${resultCircles.length + 1}`,
        format: CIRCLE_FORMAT.HOSTED, // Default to hosted for small circles
      }).returning()

      // Select host
      const host = this.selectHost(remainingUsers)
      await db.insert(circleMembers).values({
        circleId: circle.id,
        userId: host.userId,
        role: CIRCLE_ROLES.HOST,
      })
      usedUsers.add(host.userId)

      // Add remaining users as participants
      const guests = remainingUsers.filter(u => u.userId !== host.userId)
      for (const guest of guests) {
        await db.insert(circleMembers).values({
          circleId: circle.id,
          userId: guest.userId,
          role: CIRCLE_ROLES.PARTICIPANT,
        })
        usedUsers.add(guest.userId)
      }

      const circleWithMembers = await this.getCircleWithMembers(circle.id)
      resultCircles.push(circleWithMembers)
    }

    return resultCircles
  }

  /**
   * Get matching results for an event
   */
  static async getMatchingResults(eventId: number): Promise<Circle[]> {
    const eventCircles = await db.select({
      id: circles.id,
      name: circles.name,
      format: circles.format,
    }).from(circles).where(eq(circles.eventId, eventId))

    const circlesWithMembers = await Promise.all(
      eventCircles.map(circle => this.getCircleWithMembers(circle.id))
    )

    return circlesWithMembers
  }

  /**
   * Get user's circle for an event
   */
  static async getUserCircle(eventId: number, userId: number): Promise<Circle | null> {
    const userCircle = await db.select({
      circleId: circleMembers.circleId,
    }).from(circleMembers)
    .innerJoin(circles, eq(circleMembers.circleId, circles.id))
    .where(and(
      eq(circles.eventId, eventId),
      eq(circleMembers.userId, userId)
    )).then(res => res[0])

    if (!userCircle) {
      return null
    }

    return await this.getCircleWithMembers(userCircle.circleId)
  }

  /**
   * Check if user is opted in for an event
   */
  static async isUserOptedIn(eventId: number, userId: number): Promise<boolean> {
    const optIn = await db.select().from(matchingPool)
      .where(and(
        eq(matchingPool.eventId, eventId),
        eq(matchingPool.userId, userId)
      )).then(res => res[0])

    return !!optIn
  }

  /**
   * Get matching pool for an event (admin only)
   */
  static async getMatchingPool(eventId: number): Promise<OptInUser[]> {
    const optIns = await db.select({
      id: matchingPool.id,
      userId: matchingPool.userId,
      partnerId: matchingPool.partnerId,
      matchAddress: matchingPool.matchAddress,
      hostingAvailable: matchingPool.hostingAvailable,
      user: {
        id: users.id,
        name: users.name,
        interests: users.interests,
        personalityType: users.personalityType,
        cookingExperience: users.cookingExperience,
        dietaryRestrictions: users.dietaryRestrictions,
        socialPreferences: users.socialPreferences,
      }
    }).from(matchingPool)
    .innerJoin(users, eq(matchingPool.userId, users.id))
    .where(eq(matchingPool.eventId, eventId))
    .orderBy(desc(matchingPool.createdAt))

    // Get partner information
    const optInsWithPartners = await Promise.all(
      optIns.map(async (optIn) => {
        if (optIn.partnerId) {
          const partner = await db.select({
            id: users.id,
            name: users.name,
            interests: users.interests,
            personalityType: users.personalityType,
            cookingExperience: users.cookingExperience,
            dietaryRestrictions: users.dietaryRestrictions,
            socialPreferences: users.socialPreferences,
          }).from(users).where(eq(users.id, optIn.partnerId)).then(res => res[0])
          
          return { ...optIn, partner }
        }
        return optIn
      })
    )

    return optInsWithPartners
  }
}
