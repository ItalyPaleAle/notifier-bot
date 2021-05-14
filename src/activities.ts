import newWebhook from './activities/new-webhook'
import listWebhooks from './activities/list-webhooks'
import activityRouter from './lib/activity-router'

// Add all activities
activityRouter.add(
    {
        type: 'message',
        text: /^(new|add|create) webhook$/i,
    },
    newWebhook
)
activityRouter.add(
    {
        type: 'message',
        text: /^list webhooks?$/i,
    },
    listWebhooks
)
