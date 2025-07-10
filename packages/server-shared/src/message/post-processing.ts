import { z } from 'zod';

export const AssumptionClassificationSchema = z.enum([
  'fieldMapping',
  'tableRelationship',
  'dataQuality',
  'dataFormat',
  'dataAvailability',
  'timePeriodInterpretation',
  'timePeriodGranularity',
  'metricInterpretation',
  'segmentInterpretation',
  'quantityInterpretation',
  'requestScope',
  'metricDefinition',
  'segmentDefinition',
  'businessLogic',
  'policyInterpretation',
  'optimization',
  'aggregation',
  'filtering',
  'sorting',
  'grouping',
  'calculationMethod',
  'dataRelevance',
]);

export const AssumptionLabelSchema = z.enum(['timeRelated', 'vagueRequest', 'major', 'minor']);

export const ConfidenceScoreSchema = z.enum(['low', 'high']);

export const AssumptionSchema = z.object({
  descriptive_title: z.string(),
  classification: AssumptionClassificationSchema,
  explanation: z.string(),
  label: AssumptionLabelSchema,
});

export const PostProcessingMessageSchema = z.object({
  confidence_score: ConfidenceScoreSchema,
  summary_message: z.string(),
  summary_title: z.string(),
  assumptions: z.array(AssumptionSchema).optional(),
  tool_called: z.string(),
  user_name: z.string(),
});

export type AssumptionClassification = z.infer<typeof AssumptionClassificationSchema>;
export type AssumptionLabel = z.infer<typeof AssumptionLabelSchema>;
export type ConfidenceScore = z.infer<typeof ConfidenceScoreSchema>;
export type Assumption = z.infer<typeof AssumptionSchema>;
export type PostProcessingMessage = z.infer<typeof PostProcessingMessageSchema>;
