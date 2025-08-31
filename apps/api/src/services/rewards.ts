import { db } from '../db/client'
import { userPoints, pointTransactions, userBadges, events, users, neighbourhoods, matchingPool } from '../db/schema'
import { eq, and, desc, count, sql, gte, lte } from 'drizzle-orm'

export interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: string
  category: 'hosting' | 'community' | 'milestone'
  requirements: {
    type: 'events_participated' | 'events_hosted' | 'courses_hosted' | 'ratings_received' | 'points_earned'
    count: number
  }
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Hosting Badges
  {
    id: 'first_host',
    name: 'First Host',
    description: 'Hosted your first dinner event',
    icon: '🏠',
    category: 'hosting',
    requirements: { type: 'events_hosted', count: 1 }
  },
  {
    id: 'five_host',
    name: '5x Host',
    description: 'Hosted 5 dinner events',
    icon: '🏆',
    category: 'hosting',
    requirements: { type: 'events_hosted', count: 5 }
  },
  {
    id: 'all_courses',
    name: 'All 3 Courses',
    description: 'Hosted starter, main, and dessert courses',
    icon: '👨‍🍳',
    category: 'hosting',
    requirements: { type: 'courses_hosted', count: 3 }
  },
  // Community Badges
  {
    id: 'warm_host',
    name: 'Warm Host',
    description: 'Received excellent host ratings',
    icon: '❤️',
    category: 'community',
    requirements: { type: 'ratings_received', count: 5 }
  },
  {
    id: 'connector',
    name: 'Connector',
    description: 'Helped bring people together',
    icon: '🤝',
    category: 'community',
    requirements: { type: 'events_participated', count: 10 }
  },
  {
    id: 'great_guest',
    name: 'Great Guest',
    description: 'Received excellent guest ratings',
    icon: '⭐',
    category: 'community',
    requirements: { type: 'ratings_received', count: 3 }
  },
  // Milestone Badges
  {
    id: 'neighborhood_star',
    name: 'Neighborhood Star',
    description: 'Became a local dining legend',
    icon: '🌟',
    category: 'milestone',
    requirements: { type: 'points_earned', count: 1000 }
  },
  {
    id: 'pioneer',
    name: 'Pioneer',
    description: 'One of the first members',
    icon: '🚀',
    category: 'milestone',
    requirements: { type: 'events_participated', count: 1 }
  },
  {
    id: 'super_chef',
    name: 'Super Chef',
    description: 'Master of all culinary arts',
    icon: '👨‍🍳',
    category: 'milestone',
    requirements: { type: 'events_hosted', count: 10 }
  }
]

export class RewardsService {
  /**
   * Award points to a user
   */
  static async awardPoints(
    userId: number,
    points: number,
    reason: string,
    eventId?: number,
    details?: string
  ): Promise<void> {
    // Create transaction record
    await db.insert(pointTransactions).values({
      userId,
      eventId: eventId || null,
      pointsEarned: points,
      reason,
      details: details || null,
    })

    // Update user's total points
    const [existingPoints] = await db.select().from(userPoints).where(eq(userPoints.userId, userId))
    
    if (existingPoints) {
      await db.update(userPoints)
        .set({
          points: existingPoints.points + points,
          totalPointsEarned: existingPoints.totalPointsEarned + points,
          lastUpdated: new Date(),
        })
        .where(eq(userPoints.userId, userId))
    } else {
      await db.insert(userPoints).values({
        userId,
        points,
        totalPointsEarned: points,
      })
    }
  }

  /**
   * Check and award badges based on user activity
   */
  static async checkAndAwardBadges(userId: number): Promise<string[]> {
    const awardedBadges: string[] = []
    const userStats = await this.getUserStats(userId)
    const existingBadges = await this.getUserBadges(userId)

    for (const badgeDef of BADGE_DEFINITIONS) {
      // Skip if user already has this badge
      if (existingBadges.some(badge => badge.badgeType === badgeDef.id)) {
        continue
      }

      // Check if user meets requirements
      let meetsRequirements = false
      switch (badgeDef.requirements.type) {
        case 'events_participated':
          meetsRequirements = userStats.eventsParticipated >= badgeDef.requirements.count
          break
        case 'events_hosted':
          meetsRequirements = userStats.eventsHosted >= badgeDef.requirements.count
          break
        case 'courses_hosted':
          meetsRequirements = userStats.coursesHosted >= badgeDef.requirements.count
          break
        case 'ratings_received':
          meetsRequirements = userStats.ratingsReceived >= badgeDef.requirements.count
          break
        case 'points_earned':
          meetsRequirements = userStats.totalPoints >= badgeDef.requirements.count
          break
      }

      if (meetsRequirements) {
        // Award the badge
        await db.insert(userBadges).values({
          userId,
          badgeType: badgeDef.id,
        })
        awardedBadges.push(badgeDef.id)
      }
    }

    return awardedBadges
  }

  /**
   * Get user statistics for badge checking
   */
  private static async getUserStats(userId: number) {
    // Get events opted into
    const [eventsParticipated] = await db.select({ count: count() })
      .from(matchingPool)
      .where(eq(matchingPool.userId, userId))

    // Get events where hosting is available
    const [eventsHosted] = await db.select({ count: count() })
      .from(matchingPool)
      .where(and(eq(matchingPool.userId, userId), eq(matchingPool.hostingAvailable, true)))

    // Get ratings received (simplified - in real app you'd check actual ratings)
    const [ratingsReceived] = await db.select({ count: count() })
      .from(matchingPool)
      .where(eq(matchingPool.userId, userId))

    // Get total points
    const [userPointsData] = await db.select().from(userPoints).where(eq(userPoints.userId, userId))

    return {
      eventsParticipated: eventsParticipated.count,
      eventsHosted: eventsHosted.count,
      coursesHosted: 0, // Will be updated when circles are implemented
      ratingsReceived: ratingsReceived.count,
      totalPoints: userPointsData?.totalPointsEarned || 0,
    }
  }

  /**
   * Get user's badges
   */
  static async getUserBadges(userId: number) {
    return await db.select({
      id: userBadges.id,
      badgeType: userBadges.badgeType,
      awardedAt: userBadges.awardedAt,
    }).from(userBadges)
    .where(eq(userBadges.userId, userId))
    .orderBy(desc(userBadges.awardedAt))
  }

  /**
   * Get user's points and transaction history
   */
  static async getUserPoints(userId: number) {
    const [pointsData] = await db.select().from(userPoints).where(eq(userPoints.userId, userId))
    
    const transactions = await db.select({
      id: pointTransactions.id,
      pointsEarned: pointTransactions.pointsEarned,
      reason: pointTransactions.reason,
      details: pointTransactions.details,
      createdAt: pointTransactions.createdAt,
      event: {
        id: events.id,
        title: events.date, // Use date as title for now
      }
    }).from(pointTransactions)
    .leftJoin(events, eq(pointTransactions.eventId, events.id))
    .where(eq(pointTransactions.userId, userId))
    .orderBy(desc(pointTransactions.createdAt))

    return {
      currentPoints: pointsData?.points || 0,
      totalPointsEarned: pointsData?.totalPointsEarned || 0,
      transactions,
    }
  }

  /**
   * Get leaderboard for a neighbourhood
   */
  static async getLeaderboard(neighbourhoodId?: number, limit: number = 10) {
    let whereClause = undefined
    if (neighbourhoodId) {
      // Join with users to filter by neighbourhood
      whereClause = sql`${userPoints.userId} IN (
        SELECT id FROM users WHERE neighbourhood = (SELECT name FROM neighbourhoods WHERE id = ${neighbourhoodId})
      )`
    }

    const leaderboard = await db.select({
      userId: userPoints.userId,
      points: userPoints.points,
      totalPointsEarned: userPoints.totalPointsEarned,
      user: {
        id: users.id,
        name: users.name,
        username: users.username,
      }
    }).from(userPoints)
    .innerJoin(users, eq(userPoints.userId, users.id))
    .where(whereClause || sql`1=1`)
    .orderBy(desc(userPoints.points))
    .limit(limit)

    return leaderboard
  }

  /**
   * Award points for event participation
   */
  static async awardEventParticipationPoints(userId: number, eventId: number, isHost: boolean): Promise<void> {
    const basePoints = isHost ? 50 : 25
    const reason = isHost ? 'Hosted dinner event' : 'Participated in dinner event'
    
    await this.awardPoints(userId, basePoints, reason, eventId)
    
    // Check for badges after awarding points
    await this.checkAndAwardBadges(userId)
  }

  /**
   * Award points for course hosting (rotating dinners)
   */
  static async awardCourseHostingPoints(userId: number, eventId: number, course: string): Promise<void> {
    const coursePoints = {
      starter: 30,
      main: 40,
      dessert: 25
    }
    
    const points = coursePoints[course as keyof typeof coursePoints] || 25
    const reason = `Hosted ${course} course`
    
    await this.awardPoints(userId, points, reason, eventId, `Course: ${course}`)
    
    // Check for badges after awarding points
    await this.checkAndAwardBadges(userId)
  }

  /**
   * Award points for receiving good ratings
   */
  static async awardRatingPoints(userId: number, rating: number, isHost: boolean): Promise<void> {
    let points = 0
    let reason = ''
    
    if (rating >= 4) {
      points = isHost ? 20 : 15
      reason = isHost ? 'Received excellent host rating' : 'Received excellent guest rating'
    } else if (rating >= 3) {
      points = isHost ? 10 : 8
      reason = isHost ? 'Received good host rating' : 'Received good guest rating'
    }
    
    if (points > 0) {
      await this.awardPoints(userId, points, reason)
      await this.checkAndAwardBadges(userId)
    }
  }

  /**
   * Get all badge definitions
   */
  static getBadgeDefinitions(): BadgeDefinition[] {
    return BADGE_DEFINITIONS
  }

  /**
   * Get user's progress towards badges
   */
  static async getUserBadgeProgress(userId: number) {
    const userStats = await this.getUserStats(userId)
    const existingBadges = await this.getUserBadges(userId)
    const existingBadgeIds = new Set(existingBadges.map(b => b.badgeType))

    return BADGE_DEFINITIONS.map(badgeDef => {
      let progress = 0
      let current = 0
      let required = badgeDef.requirements.count

      switch (badgeDef.requirements.type) {
        case 'events_participated':
          current = userStats.eventsParticipated
          break
        case 'events_hosted':
          current = userStats.eventsHosted
          break
        case 'courses_hosted':
          current = userStats.coursesHosted
          break
        case 'ratings_received':
          current = userStats.ratingsReceived
          break
        case 'points_earned':
          current = userStats.totalPoints
          break
      }

      progress = Math.min((current / required) * 100, 100)

      return {
        ...badgeDef,
        earned: existingBadgeIds.has(badgeDef.id),
        progress: Math.round(progress),
        current,
        required,
      }
    })
  }
}
