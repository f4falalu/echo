'use server';

import { NextRequest, NextResponse } from 'next/server';

interface BaseRequest {
  userName: string;
  userEmail: string;
  organizationId: string;
  userId: string;
  message: string;
  type: 'feedback' | 'support';
}

interface FeedbackRequest extends BaseRequest {
  type: 'feedback';
}

interface SupportRequest extends BaseRequest {
  type: 'support';
  subject: string;
}

type SupportRequestBody = FeedbackRequest | SupportRequest;

const slackHookURL = process.env.NEXT_SLACK_APP_SUPPORT_URL!;

export async function POST(request: NextRequest) {
  // Parse and validate the request body
  const body = (await request.json()) as SupportRequestBody;

  if (
    !body.userName ||
    !body.userEmail ||
    !body.organizationId ||
    !body.userId ||
    !body.message ||
    !body.type
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Additional validation for support requests
  if (body.type === 'support' && !body.subject) {
    return NextResponse.json({ error: 'Support requests require a subject' }, { status: 400 });
  }

  const slackMessage = {
    text: 'New Support Request',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*New Support Request*'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Type:* ${body.type}`
          },
          ...(body.type === 'support'
            ? [
                {
                  type: 'mrkdwn',
                  text: `*Subject:* ${body.subject}`
                }
              ]
            : []),
          {
            type: 'mrkdwn',
            text: `*From:* ${body.userName}`
          },
          {
            type: 'mrkdwn',
            text: `*Email:* ${body.userEmail}`
          },
          {
            type: 'mrkdwn',
            text: `*User ID:* ${body.userId}`
          },
          {
            type: 'mrkdwn',
            text: `*Organization ID:* ${body.organizationId}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Message:*\n${body.message}`
        }
      }
    ]
  };

  // Send the formatted message to Slack
  const response = await fetch(slackHookURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(slackMessage)
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to send message to Slack' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
