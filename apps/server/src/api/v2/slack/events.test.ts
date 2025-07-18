import { db } from '@buster/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { findOrCreateSlackChat } from './events';

vi.mock('@buster/database', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
  chats: {},
  slackIntegrations: {},
}));

describe('findOrCreateSlackChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a chat with workspace sharing when Slack integration has shareWithWorkspace', async () => {
    // Mock implementations need to handle being called twice
    let selectCallCount = 0;

    vi.mocked(db.select).mockImplementation(() => {
      selectCallCount++;

      // First call is for existing chat, second is for slack integration
      if (selectCallCount === 1) {
        // Mock for existing chat query
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        } as any;
      }
      // Mock for slack integration query
      return {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ defaultSharingPermissions: 'shareWithWorkspace' }]),
      } as any;
    });

    // Mock insert
    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'new-chat-id' }]),
    };
    vi.mocked(db.insert).mockReturnValue(mockInsert as any);

    const result = await findOrCreateSlackChat({
      threadTs: 'thread-123',
      channelId: 'channel-123',
      organizationId: 'org-123',
      userId: 'user-123',
      slackChatAuthorization: 'authorized',
      teamId: 'team-123',
    });

    expect(result).toBe('new-chat-id');
    expect(mockInsert.values).toHaveBeenCalledWith({
      title: '',
      organizationId: 'org-123',
      createdBy: 'user-123',
      updatedBy: 'user-123',
      slackChatAuthorization: 'authorized',
      slackThreadTs: 'thread-123',
      slackChannelId: 'channel-123',
      workspaceSharing: 'can_view',
      workspaceSharingEnabledBy: 'user-123',
      workspaceSharingEnabledAt: expect.any(String),
    });
  });

  it('should create a chat without workspace sharing when Slack integration has different setting', async () => {
    // Mock implementations need to handle being called twice
    let selectCallCount = 0;

    vi.mocked(db.select).mockImplementation(() => {
      selectCallCount++;

      // First call is for existing chat, second is for slack integration
      if (selectCallCount === 1) {
        // Mock for existing chat query
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        } as any;
      }
      // Mock for slack integration query
      return {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ defaultSharingPermissions: 'shareWithChannel' }]),
      } as any;
    });

    // Mock insert
    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'new-chat-id' }]),
    };
    vi.mocked(db.insert).mockReturnValue(mockInsert as any);

    const result = await findOrCreateSlackChat({
      threadTs: 'thread-123',
      channelId: 'channel-123',
      organizationId: 'org-123',
      userId: 'user-123',
      slackChatAuthorization: 'authorized',
      teamId: 'team-123',
    });

    expect(result).toBe('new-chat-id');
    expect(mockInsert.values).toHaveBeenCalledWith({
      title: '',
      organizationId: 'org-123',
      createdBy: 'user-123',
      updatedBy: 'user-123',
      slackChatAuthorization: 'authorized',
      slackThreadTs: 'thread-123',
      slackChannelId: 'channel-123',
      workspaceSharing: 'none',
      workspaceSharingEnabledBy: null,
      workspaceSharingEnabledAt: null,
    });
  });

  it('should return existing chat if found', async () => {
    // Mock implementations need to handle being called twice
    let selectCallCount = 0;

    vi.mocked(db.select).mockImplementation(() => {
      selectCallCount++;

      // First call is for existing chat, second is for slack integration
      if (selectCallCount === 1) {
        // Mock for existing chat query - chat exists
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ id: 'existing-chat-id' }]),
        } as any;
      }
      // Mock for slack integration query (won't be used due to early return)
      return {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any;
    });

    const result = await findOrCreateSlackChat({
      threadTs: 'thread-123',
      channelId: 'channel-123',
      organizationId: 'org-123',
      userId: 'user-123',
      slackChatAuthorization: 'authorized',
      teamId: 'team-123',
    });

    expect(result).toBe('existing-chat-id');
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('should create chat without workspace sharing when no Slack integration found', async () => {
    // Mock implementations need to handle being called twice
    let selectCallCount = 0;

    vi.mocked(db.select).mockImplementation(() => {
      selectCallCount++;

      // First call is for existing chat, second is for slack integration
      if (selectCallCount === 1) {
        // Mock for existing chat query
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        } as any;
      }
      // Mock for slack integration query - no integration found
      return {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any;
    });

    // Mock insert
    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'new-chat-id' }]),
    };
    vi.mocked(db.insert).mockReturnValue(mockInsert as any);

    const result = await findOrCreateSlackChat({
      threadTs: 'thread-123',
      channelId: 'channel-123',
      organizationId: 'org-123',
      userId: 'user-123',
      slackChatAuthorization: 'authorized',
      teamId: 'team-123',
    });

    expect(result).toBe('new-chat-id');
    expect(mockInsert.values).toHaveBeenCalledWith({
      title: '',
      organizationId: 'org-123',
      createdBy: 'user-123',
      updatedBy: 'user-123',
      slackChatAuthorization: 'authorized',
      slackThreadTs: 'thread-123',
      slackChannelId: 'channel-123',
      workspaceSharing: 'none',
      workspaceSharingEnabledBy: null,
      workspaceSharingEnabledAt: null,
    });
  });
});
