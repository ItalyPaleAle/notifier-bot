import newWebhook from './activities/new-webhook'
import activityRouter from './lib/activity-router'

// Add all activities
activityRouter.add(
    {
        type: 'message',
        text: /^(new|add|create) webhook$/i,
    },
    newWebhook
)
