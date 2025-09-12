import type { PermissionedDataset } from '@buster/access-controls';
import type { UserPersonalizationConfigType } from '@buster/database';
import type { CoreMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import type { PostProcessingResult } from '../types';
import { buildWorkflowInput } from './data-transformers';

describe('data-transformers', () => {
  describe('buildWorkflowInput', () => {
    const mockConversationHistory: CoreMessage[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ];

    const mockDatasets: PermissionedDataset[] = [
      {
        id: 'dataset-1',
        name: 'Sales Data',
        description: 'Sales dataset',
        ymlContent: 'name: sales\ntables:\n  - name: orders',
        type: 'dataset',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any,
      {
        id: 'dataset-2',
        name: 'Products Data',
        description: 'Products dataset',
        ymlContent: 'name: products\ntables:\n  - name: inventory',
        type: 'dataset',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any,
    ];

    const mockOrganizationDocs = [
      {
        id: 'doc-1',
        name: 'Guidelines',
        content: 'Content here',
        type: 'documentation',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'doc-2',
        name: 'Best Practices',
        content: 'More content',
        type: 'documentation',
        updatedAt: new Date().toISOString(),
      },
    ];

    const mockUserPersonalization: UserPersonalizationConfigType = {
      currentRole: 'analyst',
      customInstructions: 'Be concise and professional',
      additionalInformation: 'Focus on insights',
    };

    it('should build workflow input with minimal required fields', () => {
      const result = buildWorkflowInput(
        mockConversationHistory,
        [], // no previous results
        mockDatasets,
        'postgresql',
        'John Doe',
        false, // no slack message
        null, // no personalization
        null, // no analyst instructions
        [] // no org docs
      );

      expect(result).toEqual({
        conversationHistory: mockConversationHistory,
        userName: 'John Doe',
        isFollowUp: false,
        isSlackFollowUp: false,
        datasets: mockDatasets,
        dataSourceSyntax: 'postgresql',
        userPersonalizationConfig: undefined,
        analystInstructions: undefined,
        organizationDocs: undefined,
      });
    });

    it('should determine follow-up status based on previous results', () => {
      const previousResults: PostProcessingResult[] = [
        {
          postProcessingMessage: { test: 'data' },
          createdAt: new Date(),
        },
      ];

      const result = buildWorkflowInput(
        mockConversationHistory,
        previousResults,
        mockDatasets,
        'postgresql',
        'John Doe',
        false,
        null,
        null,
        []
      );

      expect(result.isFollowUp).toBe(true);
      expect(result.isSlackFollowUp).toBe(false);
    });

    it('should determine Slack follow-up when both conditions are met', () => {
      const previousResults: PostProcessingResult[] = [
        {
          postProcessingMessage: { test: 'data' },
          createdAt: new Date(),
        },
      ];

      const result = buildWorkflowInput(
        mockConversationHistory,
        previousResults,
        mockDatasets,
        'postgresql',
        'John Doe',
        true, // slackMessageExists = true
        null,
        null,
        []
      );

      expect(result.isFollowUp).toBe(true);
      expect(result.isSlackFollowUp).toBe(true);
    });

    it('should not be Slack follow-up if not a follow-up', () => {
      const result = buildWorkflowInput(
        mockConversationHistory,
        [], // no previous results
        mockDatasets,
        'postgresql',
        'John Doe',
        true, // slack message exists
        null,
        null,
        []
      );

      expect(result.isFollowUp).toBe(false);
      expect(result.isSlackFollowUp).toBe(false); // Cannot be Slack follow-up if not a follow-up
    });

    it('should include all optional fields when provided', () => {
      const result = buildWorkflowInput(
        mockConversationHistory,
        [],
        mockDatasets,
        'snowflake',
        'Jane Smith',
        false,
        mockUserPersonalization,
        'Be thorough in analysis',
        mockOrganizationDocs
      );

      expect(result).toEqual({
        conversationHistory: mockConversationHistory,
        userName: 'Jane Smith',
        isFollowUp: false,
        isSlackFollowUp: false,
        datasets: mockDatasets,
        dataSourceSyntax: 'snowflake',
        userPersonalizationConfig: mockUserPersonalization,
        analystInstructions: 'Be thorough in analysis',
        organizationDocs: mockOrganizationDocs,
      });
    });

    it('should convert null values to undefined for optional fields', () => {
      const result = buildWorkflowInput(
        mockConversationHistory,
        [],
        mockDatasets,
        'mysql',
        'User',
        false,
        null,
        null,
        []
      );

      expect(result.userPersonalizationConfig).toBeUndefined();
      expect(result.analystInstructions).toBeUndefined();
      expect(result.organizationDocs).toBeUndefined();
    });

    it('should handle empty organization docs array', () => {
      const result = buildWorkflowInput(
        mockConversationHistory,
        [],
        mockDatasets,
        'postgresql',
        'User',
        false,
        null,
        null,
        [] // empty docs
      );

      expect(result.organizationDocs).toBeUndefined();
    });

    it('should include organization docs when not empty', () => {
      const result = buildWorkflowInput(
        mockConversationHistory,
        [],
        mockDatasets,
        'postgresql',
        'User',
        false,
        null,
        null,
        mockOrganizationDocs
      );

      expect(result.organizationDocs).toEqual(mockOrganizationDocs);
    });

    it('should handle different data source syntaxes', () => {
      const syntaxes = ['postgresql', 'mysql', 'snowflake', 'bigquery', 'databricks'];

      syntaxes.forEach((syntax) => {
        const result = buildWorkflowInput(
          mockConversationHistory,
          [],
          mockDatasets,
          syntax,
          'User',
          false,
          null,
          null,
          []
        );

        expect(result.dataSourceSyntax).toBe(syntax);
      });
    });

    it('should pass through conversation history unchanged', () => {
      const complexHistory: CoreMessage[] = [
        { role: 'user', content: 'What is the revenue?' },
        { role: 'assistant', content: 'Let me analyze that for you.' },
        { role: 'user', content: 'Can you break it down by region?' },
        { role: 'assistant', content: 'Here is the breakdown...' },
      ];

      const result = buildWorkflowInput(
        complexHistory,
        [],
        mockDatasets,
        'postgresql',
        'User',
        false,
        null,
        null,
        []
      );

      expect(result.conversationHistory).toBe(complexHistory);
      expect(result.conversationHistory).toHaveLength(4);
    });
  });
});
