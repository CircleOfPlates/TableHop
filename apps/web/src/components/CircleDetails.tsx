import type { Circle } from '../lib/api';

interface CircleDetailsProps {
  circle: Circle;
  currentUserId: number;
}

const getRoleDisplayName = (role: string) => {
  switch (role) {
    case 'host':
      return 'Host';
    case 'participant':
      return 'Guest';
    case 'starter':
      return 'Starter Course';
    case 'main':
      return 'Main Course';
    case 'dessert':
      return 'Dessert Course';
    default:
      return role;
  }
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'host':
      return 'bg-purple-100 text-purple-800';
    case 'participant':
      return 'bg-blue-100 text-blue-800';
    case 'starter':
      return 'bg-green-100 text-green-800';
    case 'main':
      return 'bg-orange-100 text-orange-800';
    case 'dessert':
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getFormatIcon = (format: string) => {
  switch (format) {
    case 'rotating':
      return '🔄';
    case 'hosted':
      return '🏠';
    default:
      return '🍽️';
  }
};

export function CircleDetails({ circle, currentUserId }: CircleDetailsProps) {
  const currentMember = circle.members.find(member => member.userId === currentUserId);
  const otherMembers = circle.members.filter(member => member.userId !== currentUserId);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Circle Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            {getFormatIcon(circle.format)} {circle.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {circle.format === 'rotating' 
              ? 'Rotating Dinner - Each person hosts one course'
              : 'Hosted Dinner - One person hosts the entire meal'
            }
          </p>
        </div>
        {currentMember && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(currentMember.role)}`}>
            Your Role: {getRoleDisplayName(currentMember.role)}
          </div>
        )}
      </div>

      {/* Circle Members */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Circle Members ({circle.members.length})</h4>
        
        <div className="grid gap-4">
          {/* Current User */}
          {currentMember && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                    {currentMember.user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-medium text-blue-900">
                      {currentMember.user.name || 'Unknown User'} (You)
                    </div>
                    <div className="text-sm text-blue-700">
                      {getRoleDisplayName(currentMember.role)}
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(currentMember.role)}`}>
                  {getRoleDisplayName(currentMember.role)}
                </div>
              </div>
              
              {/* User Details */}
              <div className="mt-3 space-y-2">
                {currentMember.user.interests && currentMember.user.interests.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-blue-700">Interests:</span>{' '}
                    <span className="text-blue-600">{currentMember.user.interests.join(', ')}</span>
                  </div>
                )}
                {currentMember.user.dietaryRestrictions && (
                  <div className="text-sm">
                    <span className="font-medium text-blue-700">Dietary:</span>{' '}
                    <span className="text-blue-600">{currentMember.user.dietaryRestrictions}</span>
                  </div>
                )}
                {currentMember.user.cookingExperience && (
                  <div className="text-sm">
                    <span className="font-medium text-blue-700">Cooking Level:</span>{' '}
                    <span className="text-blue-600 capitalize">{currentMember.user.cookingExperience}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Other Members */}
          {otherMembers.map((member) => (
            <div key={member.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-medium">
                    {member.user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {member.user.name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {getRoleDisplayName(member.role)}
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                  {getRoleDisplayName(member.role)}
                </div>
              </div>
              
              {/* User Details */}
              <div className="mt-3 space-y-2">
                {member.user.interests && member.user.interests.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Interests:</span>{' '}
                    <span className="text-gray-600">{member.user.interests.join(', ')}</span>
                  </div>
                )}
                {member.user.dietaryRestrictions && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Dietary:</span>{' '}
                    <span className="text-gray-600">{member.user.dietaryRestrictions}</span>
                  </div>
                )}
                {member.user.cookingExperience && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Cooking Level:</span>{' '}
                    <span className="text-gray-600 capitalize">{member.user.cookingExperience}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Circle Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h5 className="font-medium text-yellow-900 mb-2">
          {circle.format === 'rotating' ? 'Rotating Dinner Instructions' : 'Hosted Dinner Instructions'}
        </h5>
        {circle.format === 'rotating' ? (
          <div className="text-sm text-yellow-800 space-y-1">
            <p>• Each person will host one course at their home</p>
            <p>• You'll rotate between homes for starter, main, and dessert</p>
            <p>• Coordinate with your circle members for timing and logistics</p>
            <p>• Consider dietary restrictions when planning your course</p>
          </div>
        ) : (
          <div className="text-sm text-yellow-800 space-y-1">
            <p>• The host will provide the venue and coordinate the entire meal</p>
            <p>• Guests should bring a dish or beverage to contribute</p>
            <p>• Coordinate with the host for timing and what to bring</p>
            <p>• Consider dietary restrictions when planning contributions</p>
          </div>
        )}
      </div>
    </div>
  );
}
