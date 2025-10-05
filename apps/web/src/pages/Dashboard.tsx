import { Card, Button } from '../components/ui'
import { useLocation } from 'wouter'
import { toast } from 'sonner'
import ProfileCompletionBanner from '../components/ProfileCompletionBanner'
import AuthGuard from '../components/AuthGuard'
import { useQuery } from '@tanstack/react-query'
import { api, eventsApi } from '../lib/api'
import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import CircleChat from '../components/CircleChat'

export default function Dashboard() {
  const [location, setLocation] = useLocation()
  const [activeTab, setActiveTab] = useState('upcoming')
  const isWelcome = location.includes('welcome=true')
  const { user } = useAuth()
  
  const { data: userEvents } = useQuery({
    queryKey: ['user-events'],
    queryFn: () => api<any[]>('/api/events/my-events'),
  })

  const { data: optedInEvents } = useQuery({
    queryKey: ['opted-in-events'],
    queryFn: () => api<any[]>('/api/events/my-opted-in'),
  })

  const { data: matchedEvents } = useQuery({
    queryKey: ['matched-events'],
    queryFn: () => eventsApi.getMyMatchedEvents(),
  })

  const { data: pastEvents } = useQuery({
    queryKey: ['past-events'],
    queryFn: () => eventsApi.getMyPastEvents(),
  })
  
  if (isWelcome) {
    toast.success('Welcome to TableHop! Your profile is complete.')
  }

  const upcomingEvents = matchedEvents || []
  
  // Get events user has opted in for but hasn't been matched yet
  const optedInButNotMatched = optedInEvents || []

  const tabs = [
    { id: 'upcoming', label: 'Upcoming Circles', icon: CalendarIcon },
    { id: 'matches', label: 'Your Matches', icon: UserGroupIcon },
    { id: 'chat', label: 'Group Chat', icon: ChatBubbleLeftRightIcon },
    { id: 'past', label: 'Past Circles', icon: CalendarIcon }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
             case 'upcoming':
         return (
           <div className="space-y-6">
             {/* Matched Events (if any) */}
             {upcomingEvents.length > 0 && (
               <div className="space-y-6">
                 {upcomingEvents.map((event: any) => (
                   <Card key={event.id} className="p-6">
                     <div className="flex items-start justify-between mb-4">
                       <div>
                         <h2 className="text-2xl font-bold text-gray-900 mb-2">
                           {new Date(event.date).toLocaleDateString('en-US', {
                             weekday: 'long',
                             month: 'long',
                             day: 'numeric'
                           })} Neighborhood Feast
                         </h2>
                         <p className="text-gray-600">Get ready for an amazing evening of food and friendship!</p>
                       </div>
                       <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                         event.circle.format === 'rotating' 
                           ? 'bg-red-100 text-red-800' 
                           : 'bg-blue-100 text-blue-800'
                       }`}>
                         {event.circle.format === 'rotating' ? 'Rotating Dinner' : 'Hosted Dinner'}
                       </span>
                     </div>

                     {/* Event Overview */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                       <div className="flex items-center gap-3">
                         <CalendarIcon className="w-5 h-5 text-red-500" />
                         <div>
                           <div className="font-medium">
                             {new Date(event.date).toLocaleDateString('en-US', {
                               weekday: 'long',
                               month: 'long',
                               day: 'numeric'
                             })}
                           </div>
                           <div className="text-sm text-gray-500">
                             {new Date(event.date).toDateString() === new Date().toDateString() 
                               ? 'Today' 
                               : new Date(event.date).toDateString() === new Date(Date.now() + 86400000).toDateString()
                               ? 'Tomorrow'
                               : new Date(event.date).toDateString() === new Date(Date.now() + 172800000).toDateString()
                               ? 'Day after tomorrow'
                               : 'Upcoming'
                             }
                           </div>
                         </div>
                       </div>
                       <div className="flex items-center gap-3">
                         <ClockIcon className="w-5 h-5 text-red-500" />
                         <div>
                           <div className="font-medium">{event.startTime} - {event.endTime}</div>
                           <div className="text-sm text-gray-500">4 hour experience</div>
                         </div>
                       </div>
                       <div className="flex items-center gap-3">
                         <MapPinIcon className="w-5 h-5 text-red-500" />
                         <div>
                           <div className="font-medium">Location TBD</div>
                           <div className="text-sm text-gray-500">
                             {event.circle.format === 'rotating' ? '3 locations' : '1 location'}
                           </div>
                         </div>
                       </div>
                     </div>

                     {/* User Role Card */}
                     <Card className="p-4 bg-red-50 border-red-200 mb-6">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                           <span className="text-red-600 text-sm">
                             {event.circle.format === 'rotating' ? '🍽️' : '🏠'}
                           </span>
                         </div>
                         <div className="flex-1">
                           <div className="font-medium">
                             Your Role: {
                               event.circle.format === 'rotating' 
                                 ? event.circle.members.find((m: any) => m.userId === (userEvents?.find((ue: any) => ue.id === event.id)?.userId || 0))?.role || 'Participant'
                                 : event.circle.members.find((m: any) => m.userId === (userEvents?.find((ue: any) => ue.id === event.id)?.userId || 0))?.role === 'host' ? 'Host' : 'Participant'
                             }
                           </div>
                           <div className="text-sm text-gray-600">
                             {event.circle.format === 'rotating' 
                               ? 'You\'ll be participating in a rotating dinner format!'
                               : 'You\'ll be enjoying a hosted dinner experience!'
                             }
                           </div>
                         </div>
                       </div>
                     </Card>

                     {/* Evening Schedule */}
                     <div>
                       <h3 className="text-lg font-bold text-gray-900 mb-4">YOUR EVENING SCHEDULE</h3>
                       <div className="space-y-4">
                         {event.circle.format === 'rotating' ? (
                           <>
                             <div className="flex gap-4">
                               <div className="w-16 text-sm font-medium text-gray-500">6:00 PM</div>
                               <div className="flex-1">
                                 <div className="font-medium">Starters & Welcome Drinks</div>
                                 <div className="text-sm text-gray-600">Location TBD</div>
                                 <div className="text-sm text-gray-500">Arrive and enjoy appetizers</div>
                               </div>
                             </div>
                             <div className="flex gap-4">
                               <div className="w-16 text-sm font-medium text-gray-500">7:30 PM</div>
                               <div className="flex-1">
                                 <div className="font-medium">Main Course</div>
                                 <div className="text-sm text-gray-600">Location TBD</div>
                                 <div className="text-sm text-gray-500">Enjoy the main course</div>
                               </div>
                             </div>
                             <div className="flex gap-4">
                               <div className="w-16 text-sm font-medium text-gray-500">9:00 PM</div>
                               <div className="flex-1">
                                 <div className="font-medium">Dessert & Coffee</div>
                                 <div className="text-sm text-gray-600">Location TBD</div>
                                 <div className="text-sm text-gray-500">Relax and enjoy dessert</div>
                               </div>
                             </div>
                           </>
                         ) : (
                           <>
                             <div className="flex gap-4">
                               <div className="w-16 text-sm font-medium text-gray-500">6:00 PM</div>
                               <div className="flex-1">
                                 <div className="font-medium">Arrival & Welcome</div>
                                 <div className="text-sm text-gray-600">Host's Location</div>
                                 <div className="text-sm text-gray-500">Arrive and meet your dinner companions</div>
                               </div>
                             </div>
                             <div className="flex gap-4">
                               <div className="w-16 text-sm font-medium text-gray-500">7:00 PM</div>
                               <div className="flex-1">
                                 <div className="font-medium">Dinner & Conversation</div>
                                 <div className="text-sm text-gray-600">Host's Location</div>
                                 <div className="text-sm text-gray-500">Enjoy dinner and great conversation</div>
                               </div>
                             </div>
                             <div className="flex gap-4">
                               <div className="w-16 text-sm font-medium text-gray-500">9:00 PM</div>
                               <div className="flex-1">
                                 <div className="font-medium">Dessert & Farewell</div>
                                 <div className="text-sm text-gray-600">Host's Location</div>
                                 <div className="text-sm text-gray-500">Dessert and goodbyes</div>
                               </div>
                             </div>
                           </>
                         )}
                       </div>
                     </div>
                   </Card>
                 ))}
               </div>
             )}
            
            {/* Opted In But Not Matched Events */}
            {optedInButNotMatched.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Waiting for Matching</h3>
                {optedInButNotMatched.map((event: any) => (
                  <Card key={event.id} className="p-6 border-orange-200 bg-orange-50">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-semibold text-orange-900 mb-2">
                          {new Date(event.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })} Dinner
                        </h4>
                        <p className="text-orange-700">You've opted in and we're working on matching you with other participants!</p>
                      </div>
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                        Matching in Progress
                      </span>
                    </div>

                                         {/* Event Details */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                       <div className="flex items-center gap-3">
                         <ClockIcon className="w-5 h-5 text-orange-500" />
                         <div>
                           <div className="font-medium">{event.startTime} - {event.endTime}</div>
                           <div className="text-sm text-orange-600">4 hour experience</div>
                         </div>
                       </div>
                       <div className="flex items-center gap-3">
                         <MapPinIcon className="w-5 h-5 text-orange-500" />
                         <div>
                           <div className="font-medium">Location TBD</div>
                           <div className="text-sm text-orange-600">Will be assigned after matching</div>
                         </div>
                       </div>
                     </div>

                     {/* Status Message */}
                     <div className="bg-white p-4 rounded-lg border border-orange-200">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                           <span className="text-orange-600 text-sm">⏳</span>
                         </div>
                         <div className="flex-1">
                           <div className="font-medium text-orange-900">Matching Status</div>
                           <div className="text-sm text-orange-700">
                             We're working on matching you with other participants. You'll be notified once your circle is ready!
                           </div>
                         </div>
                       </div>
                     </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State - only show if no matched events AND no opted in events */}
            {upcomingEvents.length === 0 && optedInButNotMatched.length === 0 && (
              <div className="text-center py-12">
                <HeartIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">YOUR CIRCLE JOURNEY STARTS HERE</h2>
                <p className="text-gray-600 mb-6">Once you attend your first circle, you'll see your amazing memories here!</p>
                <Button onClick={() => setLocation('/circles')} className="bg-red-600 hover:bg-red-700">
                  Find Your First Circle
                </Button>
              </div>
            )}
          </div>
        )

             case 'matches':
         return (
           <div className="space-y-6">
             <div className="mb-6">
               <h2 className="text-2xl font-bold text-gray-900 mb-2">MEET YOUR DINNER COMPANIONS</h2>
               <p className="text-gray-600">You'll be sharing the evening with these lovely neighbors</p>
             </div>

             {upcomingEvents.length > 0 ? (
               upcomingEvents.map((event: any) => (
                 <div key={event.id} className="space-y-4">
                   <div className="flex items-center gap-3 mb-4">
                     <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                       <CalendarIcon className="w-4 h-4 text-blue-600" />
                     </div>
                     <h3 className="text-lg font-semibold text-blue-900">
                       {new Date(event.date).toLocaleDateString('en-US', {
                         weekday: 'long',
                         month: 'long',
                         day: 'numeric'
                       })} - {event.circle.name}
                     </h3>
                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                       event.circle.format === 'rotating' 
                         ? 'bg-red-100 text-red-800' 
                         : 'bg-blue-100 text-blue-800'
                     }`}>
                       {event.circle.format === 'rotating' ? 'Rotating' : 'Hosted'}
                     </span>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {event.circle.members.map((member: any) => (
                       <Card key={member.userId} className="p-6">
                         <div className="flex items-start gap-4">
                           <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                             <span className="text-pink-600 font-medium">
                               {member.user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                             </span>
                           </div>
                           <div className="flex-1">
                             <div className="flex items-center justify-between mb-2">
                               <div>
                                 <div className="font-bold text-gray-900">
                                   {member.user.name?.toUpperCase() || 'Unknown User'}
                                 </div>
                                 <div className="text-sm text-gray-500">
                                   Role: {member.role}
                                 </div>
                               </div>
                               <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                 member.role === 'starter' ? 'bg-green-100 text-green-800' :
                                 member.role === 'main' ? 'bg-blue-100 text-blue-800' :
                                 member.role === 'dessert' ? 'bg-purple-100 text-purple-800' :
                                 member.role === 'host' ? 'bg-orange-100 text-orange-800' :
                                 'bg-gray-100 text-gray-800'
                               }`}>
                                 {member.role === 'starter' ? '🍃' : 
                                  member.role === 'main' ? '🍽️' : 
                                  member.role === 'dessert' ? '🍰' : 
                                  member.role === 'host' ? '🏠' : '👤'} {member.role}
                               </span>
                             </div>
                             
                             {member.user.interests && member.user.interests.length > 0 && (
                               <div className="mb-3">
                                 <div className="text-sm font-medium text-gray-900 mb-1">Interests</div>
                                 <div className="flex flex-wrap gap-1">
                                   {member.user.interests.slice(0, 3).map((interest: string, index: number) => (
                                     <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                       {interest}
                                     </span>
                                     ))}
                                   {member.user.interests.length > 3 && (
                                     <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                       +{member.user.interests.length - 3} more
                                     </span>
                                   )}
                                 </div>
                               </div>
                             )}

                             {member.user.dietaryRestrictions && (
                               <div className="mb-3">
                                 <div className="text-sm font-medium text-gray-900 mb-1">Dietary Notes</div>
                                 <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm">
                                   {member.user.dietaryRestrictions}
                                 </div>
                               </div>
                             )}

                             {member.user.cookingExperience && (
                               <div>
                                 <div className="text-sm font-medium text-gray-900 mb-1">Cooking Experience</div>
                                 <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm capitalize">
                                   {member.user.cookingExperience}
                                 </div>
                               </div>
                             )}
                           </div>
                         </div>
                       </Card>
                     ))}
                   </div>
                 </div>
               ))
             ) : (
               <div className="text-center py-12">
                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <UserGroupIcon className="w-8 h-8 text-gray-400" />
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matches Yet</h3>
                 <p className="text-gray-600 mb-4">You haven't been matched for any upcoming events yet.</p>
                 <Button onClick={() => setLocation('/events')} className="bg-red-600 hover:bg-red-700">
                   Browse Events
                 </Button>
               </div>
             )}
           </div>
         )

      case 'chat':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">GROUP CHAT</h2>
              <p className="text-gray-600">Chat with your dinner circle members</p>
            </div>

            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event: any) => (
                <div key={event.id} className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-blue-900">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })} - {event.circle.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      event.circle.format === 'rotating' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {event.circle.format === 'rotating' ? 'Rotating' : 'Hosted'}
                    </span>
                  </div>

                  <CircleChat
                    circleId={event.circle.id}
                    circleName={event.circle.name}
                    eventDate={event.date}
                    currentUserId={user?.id || 0}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Chats</h3>
                <p className="text-gray-600 mb-4">You don't have any upcoming events with chat access yet.</p>
                <Button onClick={() => setLocation('/events')} className="bg-red-600 hover:bg-red-700">
                  Browse Events
                </Button>
              </div>
             )}
           </div>
         )

             case 'past':
         return (
           <div className="space-y-6">
             <div className="mb-6">
               <h2 className="text-2xl font-bold text-gray-900 mb-2">YOUR DINNER MEMORIES</h2>
               <p className="text-gray-600">Relive your amazing dinner experiences and see what you've accomplished</p>
             </div>

             {pastEvents && pastEvents.length > 0 ? (
               pastEvents.map((event: any) => (
                 <Card key={event.id} className="p-6 border-gray-200">
                   <div className="flex items-start justify-between mb-4">
                     <div>
                       <h3 className="text-xl font-bold text-gray-900 mb-2">
                         {new Date(event.date).toLocaleDateString('en-US', {
                           weekday: 'long',
                           month: 'long',
                           day: 'numeric',
                           year: 'numeric'
                         })} - {event.circle.name}
                       </h3>
                       <p className="text-gray-600">
                         {event.startTime} - {event.endTime} • {event.circle.format === 'rotating' ? 'Rotating Dinner' : 'Hosted Dinner'}
                       </p>
                     </div>
                     <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                       event.circle.format === 'rotating' 
                         ? 'bg-red-100 text-red-800' 
                         : 'bg-blue-100 text-blue-800'
                     }`}>
                       {event.circle.format === 'rotating' ? 'Rotating' : 'Hosted'}
                     </span>
                   </div>

                   {/* Highlights Section */}
                   <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-4 border border-yellow-200">
                     <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                       <span className="text-lg">⭐</span>
                       Event Highlights
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {event.highlights.rating && (
                         <div className="flex items-center gap-2">
                           <span className="text-yellow-700 font-medium">Your Rating:</span>
                           <div className="flex items-center gap-1">
                             {[...Array(5)].map((_, i) => (
                               <span key={i} className={`text-lg ${
                                 i < event.highlights.rating ? 'text-yellow-500' : 'text-gray-300'
                               }`}>
                                 ★
                               </span>
                             ))}
                           </div>
                         </div>
                       )}
                       
                       {event.highlights.pointsEarned > 0 && (
                         <div className="flex items-center gap-2">
                           <span className="text-yellow-700 font-medium">Points Earned:</span>
                           <span className="text-yellow-800 font-semibold">+{event.highlights.pointsEarned}</span>
                         </div>
                       )}

                       {event.highlights.badgesEarned && event.highlights.badgesEarned.length > 0 && (
                         <div className="flex items-center gap-2">
                           <span className="text-yellow-700 font-medium">Badges Earned:</span>
                           <div className="flex gap-1">
                             {event.highlights.badgesEarned.map((badge: string, index: number) => (
                               <span key={index} className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium">
                                 {badge}
                               </span>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>

                     {event.highlights.testimonial && (
                       <div className="mt-3 pt-3 border-t border-yellow-200">
                         <span className="text-yellow-700 font-medium">Your Memory:</span>
                         <p className="text-yellow-800 italic mt-1">"{event.highlights.testimonial}"</p>
                       </div>
                     )}
                   </div>

                   {/* Circle Members */}
                   <div>
                     <h4 className="font-semibold text-gray-900 mb-3">Dinner Companions</h4>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                       {event.circle.members.map((member: any) => (
                         <div key={member.userId} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                           <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                             <span className="text-pink-600 text-xs font-medium">
                               {member.user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                             </span>
                           </div>
                           <div className="flex-1 min-w-0">
                             <div className="text-sm font-medium text-gray-900 truncate">
                               {member.user.name || 'Unknown User'}
                             </div>
                             <div className="text-xs text-gray-500 capitalize">
                               {member.role}
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 </Card>
               ))
             ) : (
               <div className="text-center py-12">
                 <HeartIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
                 <h2 className="text-2xl font-bold text-gray-900 mb-2">YOUR DINNER JOURNEY STARTS HERE</h2>
                 <p className="text-gray-600 mb-6">Once you attend your first dinner party, you'll see your amazing memories here!</p>
                 <Button onClick={() => setLocation('/events')} className="bg-red-600 hover:bg-red-700">
                   Find Your First Dinner
                 </Button>
               </div>
             )}
           </div>
         )

      default:
        return null
    }
  }

  return (
    <AuthGuard>
      <div className="container py-8 space-y-8">
        <ProfileCompletionBanner />
        
        {/* Welcome Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
            WELCOME BACK, {user?.name || user?.username || 'USER'}! 👋
          </h1>
          <p className="text-muted-foreground">Your next delicious adventure is just around the corner.</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {renderTabContent()}
        </div>
      </div>
    </AuthGuard>
  )
}


