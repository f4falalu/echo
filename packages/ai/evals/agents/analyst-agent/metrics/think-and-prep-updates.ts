import { RuntimeContext } from '@mastra/core/runtime-context';
import { Eval, initDataset } from 'braintrust';
import analystWorkflow, {
  type AnalystRuntimeContext,
} from '../../../../src/workflows/analyst-workflow';

const runAnalystWorkflow = async (input: string) => {
  const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
  runtimeContext.set('userId', 'c2dd64cd-f7f3-4884-bc91-d46ae431901e');
  runtimeContext.set('organizationId', 'bf58d19a-8bb9-4f1d-a257-2d2105e7f1ce');
  runtimeContext.set('dataSourceId', 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');
  runtimeContext.set('dataSourceSyntax', 'postgresql');

  const run = analystWorkflow.createRun();

  const response = await run.start({
    inputData: { prompt: input },
    runtimeContext,
  });

  if (response.status === 'failed') {
    throw new Error(`Workflow failed: ${response.error}`);
  }

  const formatOutputStep = response.steps['format-output'];
  if (formatOutputStep.status === 'failed') {
    throw new Error(`Format output step failed: ${formatOutputStep.error}`);
  }

  if (formatOutputStep.status === 'success') {
    return formatOutputStep.output.outputMessages || [];
  }

  return [];
};

// Your experiment configuration
Eval('development', {
  experimentName: 'random-think-and-prep-updates',
  data: initDataset({
    project: 'development',
    dataset: 'Random-Tests',
  }),
  task: runAnalystWorkflow,
  scores: [], // No scoring functions for now - just running the experiment
  maxConcurrency: 10, // Run up to 10 tests at the same time
});
