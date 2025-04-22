'use server';

import { NextRequest, NextResponse } from 'next/server';
import { AppSupportRequest } from '@/api/buster_rest/nextjs/support';

const slackHookURL = process.env.NEXT_SLACK_APP_SUPPORT_URL!;

export async function POST(request: NextRequest) {
  // Parse and validate the request body
  const body = (await request.json()) as AppSupportRequest;

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

  // Additional validation for help requests
  if (body.type === 'help' && !body.subject) {
    return NextResponse.json({ error: 'Help requests require a subject' }, { status: 400 });
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
          ...(body.type === 'help'
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
            text: `*Organization:* ${body.organizationName} (${body.organizationId})`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Message:*\n${body.message}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Additional Information:*\n• URL: ${body.currentURL}\n• Timestamp: ${body.currentTimestamp}`
        }
      },
      ...(body.screenshot
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Screenshot (base64):*\n\`\`\`${body.screenshot}\`\`\``
              }
            }
          ]
        : [])
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
