import newConversation from './activities/new-conversation'
import activityRouter from './lib/activity-router'

// Add all activities
activityRouter.add(
    {
        type: 'conversationUpdate',
    },
    newConversation
)
