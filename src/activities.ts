import activityRouter from './bot/activity-router'
import newWebhook from './activities/new-webhook'
import listWebhooks from './activities/list-webhooks'
import deleteWebhook from './activities/delete-webhook'
import deleteWebhookConfirm from './activities/delete-webhook-confirm'

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
activityRouter.add(
    {
        action: 'delete',
    },
    deleteWebhook
)
activityRouter.add(
    {
        action: 'delete/confirm',
    },
    deleteWebhookConfirm
)
