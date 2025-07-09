import {
  ConfidenceScore,
  AssumptionClassification,
  AssumptionLabel
} from '@buster/server-shared/message';

export const confidenceTranslations: Record<ConfidenceScore, string> = {
  high: 'High Confidence',
  low: 'Low Confidence'
};

export const assumptionClassificationTranslations: Record<AssumptionClassification, string> = {
  dataFormat: 'Data Format',
  dataQuality: 'Data Quality',
  dataAvailability: 'Data Availability',
  timePeriodInterpretation: 'Time Period Interpretation',
  timePeriodGranularity: 'Time Period Granularity',
  metricInterpretation: 'Metric Interpretation',
  segmentInterpretation: 'Segment Interpretation',
  quantityInterpretation: 'Quantity Interpretation',
  requestScope: 'Request Scope',
  metricDefinition: 'Metric Definition',
  segmentDefinition: 'Segment Definition',
  businessLogic: 'Business Logic',
  policyInterpretation: 'Policy Interpretation',
  optimization: 'Optimization',
  aggregation: 'Aggregation',
  filtering: 'Filtering',
  sorting: 'Sorting',
  grouping: 'Grouping',
  calculationMethod: 'Calculation Method',
  dataRelevance: 'Data Relevance',
  fieldMapping: 'Field Mapping',
  tableRelationship: 'Table Relationship'
};

export const assumptionLabelTranslations: Record<AssumptionLabel, string> = {
  major: 'Major',
  minor: 'Minor',
  timeRelated: 'Time related',
  vagueRequest: 'Vague request'
};
