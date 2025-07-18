//Seperating the prompts makes it easier to read the scorer file and makes it easier to push to braintrust later

export const usesExpectedPrecomputedMetricPrompt = `
  You are evaluating whether an LLM-generated SQL query in a 'createMetrics' tool call correctly uses a precomputed metric when one is available, as specified in the expected SQL. A precomputed metric is a single value or column in the database that directly provides the required result without needing additional calculations (e.g., SUM, COUNT, or JOINs). Using a precomputed metric is simpler, faster, and less error-prone than computing the metric manually.
  
  ### Evaluation Task
  - You are provided with:
    - The **expected SQL** (the ideal query, which may or may not use a precomputed metric).
    - The **actual output** (a JSON array of messages containing a 'createMetrics' tool call with 'yml_content' that includes the generated SQL).
  - Your task is to compare the actual SQL in the 'createMetrics' tool call to the expected SQL and determine if the actual SQL fails to use a precomputed metric when the expected SQL uses one.
  
  ### Rules for Pass/Fail
  - **Pass (Return Y)**:
    - The expected SQL does not use a precomputed metric (e.g., it performs calculations like SUM, COUNT, or JOINs), and the actual SQL is consistent with this approach (it may perform similar calculations).
    - The expected SQL uses a precomputed metric (e.g., selects a single column or value without calculations), and the actual SQL also uses the same or a similar precomputed metric (e.g., selects a single column or value without additional calculations like SUM, COUNT, or JOINs).
  - **Fail (Return N)**:
    - The expected SQL uses a precomputed metric (e.g., a direct SELECT of a single column or value without calculations), but the actual SQL performs its own calculations (e.g., uses SUM, COUNT, JOINs, or other operations) instead of using the precomputed metric.
  
  ### Instructions
  1. **Locate the Actual SQL**:
     - Find the 'createMetrics' tool call in the JSON output (look for messages with role='assistant', content containing a tool call with toolName='createMetrics' or toolName='updateMetrics).
     - Extract the 'sql' field from the 'yml_content' in the tool call's arguments (under args.files).
     - Do not report the sql, just state 'sql query found' and the number of queries found.
  2. **Analyze the Expected SQL**:
     - Check if the expected SQL uses a precomputed metric. A precomputed metric typically involves:
       - A simple SELECT statement targeting a single column or value (e.g., SELECT precomputed_value FROM table).
       - No aggregations (e.g., SUM, COUNT, AVG), no JOINs, and minimal or no WHERE clauses.
     - If the expected SQL includes aggregations (e.g., SUM, COUNT), JOINs, or complex WHERE clauses, it does not use a precomputed metric.
  3. **Compare Actual SQL to Expected SQL**:
     - If the expected SQL does not use a precomputed metric, check if the actual SQL performs similar calculations (e.g., includes aggregations or JOINs). If so, it passes.
     - If the expected SQL uses a precomputed metric, check if the actual SQL:
       - Also uses a simple SELECT of a single column or value without calculations (passes).
       - Performs calculations (e.g., SUM, COUNT, JOINs) instead of using the precomputed metric (fails).
  4. **Chain-of-Thought Reasoning**:
     - Step 1: Extract the actual SQL from the 'createMetrics' tool call in the JSON output. Never report the sql, just state 'sql query found' and the number of queries found
     - Step 2: Determine if the expected SQL uses a precomputed metric by checking for simple SELECT statements without aggregations or JOINs.
     - Step 3: If the expected SQL uses a precomputed metric, verify if the actual SQL uses a similar simple SELECT without calculations.
     - Step 4: If the expected SQL does not use a precomputed metric, confirm that the actual SQL performs appropriate calculations.
     - Step 5: Return Y for pass, N for fail based on the comparison.
  
  ### Output
  - Return **Y** if the actual SQL correctly uses a precomputed metric when required or matches the expected SQL's approach.
  - Return **N** if the actual SQL performs unnecessary calculations when a precomputed metric is available in the expected SQL.
  
  ### JSON Output
  The JSON output is:
  {{output}}
  
  ### Expected SQL
  The expected SQL is:
  {{expected}}
  
  Return Y if the condition is met, N if it is not.
`;

export const acceptableAnswersScorerPrompt = `
  You are an evaluator tasked with determining if the results returned by 'createMetrics' tool calls match any of the acceptable answers provided in the metadata. Your goal is to assess whether the actual metric results align with the expected acceptable answers, allowing for reasonable flexibility in formatting, ordering, and additional data.

  ### Evaluation Task
  - The input is a JSON array of messages representing a conversation, including user queries, assistant responses, tool calls, and tool results.
  - Focus on messages with role 'assistant' containing 'createMetrics' tool calls, which include metric results.
  - The acceptable answers are provided in the metadata field {{metadata.acceptable-answers}}.
  - Compare the actual metric results against all acceptable answer sets to determine if any match.
  - Apply flexible matching rules that account for reasonable variations in the data presentation.

  ### Acceptable Answers Format
  - The acceptable-answers metadata contains an array of answer sets: [answerSet1, answerSet2, ...]
  - Each answer set is an array of objects representing rows of data
  - Each object contains key-value pairs (e.g., {"bike": "Mountain-200 Black, 38", "sum": 2977})
  - The metric results should match at least one of these answer sets

  ### Flexible Matching Rules
  - **Rounding Differences**: Minor rounding differences in numerical values are acceptable
  - **Column Order**: Different ordering of columns within objects is acceptable
  - **Row Order**: Different ordering of rows is acceptable UNLESS the user's question ({{input}}) specifically mentions ranking, ordering, or "top N" requirements
  - **Additional Columns**: Extra columns in the actual results are acceptable as long as the required data is present
  - **Column Names**: Different column names are acceptable if the data values are equivalent (e.g., "total_sales" vs "sum" vs "revenue")
  - **Data Types**: String vs numeric representations of the same value are acceptable (e.g., "2977" vs 2977)

  ### Rules for Pass/Fail
  - **Pass (Y, score = 1)**:
    - The actual metric results match at least one acceptable answer set when applying flexible matching rules
    - All required data points from an acceptable answer are present in the actual results
    - Additional columns or minor formatting differences don't affect the core data accuracy
    - If no 'createMetrics' tool calls exist, pass by default as there are no results to evaluate
  - **Fail (N, score = 0)**:
    - The actual metric results don't match any of the acceptable answer sets
    - Required data points are missing from the actual results
    - The values differ significantly beyond reasonable rounding or formatting variations
    - Row ordering is incorrect when the question specifically asks for ranked/ordered results

  ### Chain-of-Thought Reasoning
  1. **Parse the Output**: Identify all 'createMetrics' tool calls in the JSON output and extract their results
  2. **Extract Acceptable Answers**: Parse the acceptable-answers from metadata to understand the expected answer sets
  3. **Analyze User Intent**: Check if the user's question ({{input}}) mentions ranking, ordering, or specific positioning requirements
  4. **Compare Results**: For each acceptable answer set:
     - Check if the actual results contain all required data points
     - Apply flexible matching for column names, ordering, and formatting
     - Account for additional columns that don't interfere with core data
  5. **Determine Match**: Return Y if any acceptable answer set matches the actual results, N otherwise

  ### Example Analysis Process
  1. Locate 'createMetrics' tool calls and extract results data
  2. For each acceptable answer set, check:
     - Do the key data points match (with flexibility)?
     - Are all required objects/rows represented?
     - Is ordering correct if the question requires it?
  3. Consider whether additional columns enhance rather than detract from the answer
  4. Make final determination based on whether any answer set matches

  ### Input
  - The JSON output is: {{output}}
  - The acceptable answers are: {{metadata.acceptable-answers}}
  - The user's question is: {{input}}

  ### Output
  Return 'Y' if the metric results match any acceptable answer (with flexible matching applied).
  Return 'N' if no acceptable answers match the metric results.
  Return 'Y' if no 'createMetrics' tool calls are found (nothing to evaluate).
`;

export const preferredAnswerScorerPrompt = `
  You are an evaluator tasked with determining if the results returned by 'createMetrics' tool calls match the preferred answer provided in the metadata. Your goal is to assess whether the actual metric results align with the specific preferred answer, representing the ideal response we want the system to provide. This scorer is more strict than acceptable answers since it evaluates against a single preferred outcome.

  ### Evaluation Task
  - The input is a JSON array of messages representing a conversation, including user queries, assistant responses, tool calls, and tool results.
  - Focus on messages with role 'assistant' containing 'createMetrics' or 'updateMetrics' tool calls, which include metric results.
  - The preferred answer is provided in the metadata field {{metadata.preferred-answer}}.
  - Compare the actual metric results against the single preferred answer to determine if they match.
  - Apply flexible matching rules that account for reasonable variations in data presentation while being more strict than acceptable answer matching.

  ### Preferred Answer Format
  - The preferred-answer metadata contains a single array of objects: [{...}, {...}, ...]
  - Each object contains key-value pairs representing a row of data (e.g., {"bike": "Mountain-200 Black, 38", "sum": 2977})
  - The metric results should match this specific preferred answer set

  ### Flexible Matching Rules (More Strict)
  - **Minor Rounding Differences**: Small rounding differences in numerical values are acceptable (e.g., 2977.1 vs 2977)
  - **Column Order**: Different ordering of columns within objects is acceptable
  - **Row Order**: Different ordering of rows is acceptable UNLESS the user's question ({{input}}) specifically mentions ranking, ordering, or "top N" requirements
  - **Additional Columns**: Extra columns in the actual results are acceptable as long as all required data is present and correctly formatted
  - **Column Names**: Different column names are acceptable if the data values are equivalent (e.g., "total_sales" vs "sum" vs "revenue")
  - **Data Types**: String vs numeric representations of the same value are acceptable (e.g., "2977" vs 2977)
  - **Stricter Value Matching**: Values should be substantially the same - significant differences beyond minor rounding are not acceptable

  ### Rules for Pass/Fail
  - **Pass (Y, score = 1)**:
    - The actual metric results match the preferred answer when applying flexible matching rules
    - All required data points from the preferred answer are present and substantially correct in the actual results
    - Additional columns don't detract from the core preferred answer structure
    - If no 'createMetrics' or 'updateMetrics' tool calls exist, pass by default as there are no results to evaluate
  - **Fail (N, score = 0)**:
    - The actual metric results don't match the preferred answer
    - Required data points are missing from the actual results
    - Values differ significantly beyond acceptable rounding or formatting variations
    - Row ordering is incorrect when the question specifically asks for ranked/ordered results
    - The structure or content deviates significantly from the preferred answer

  ### Chain-of-Thought Reasoning
  1. **Parse the Output**: Identify all 'createMetrics' and 'updateMetrics' tool calls in the JSON output and extract their results
  2. **Extract Preferred Answer**: Parse the preferred-answer from metadata to understand the expected answer structure
  3. **Analyze User Intent**: Check if the user's question ({{input}}) mentions ranking, ordering, or specific positioning requirements
  4. **Compare Results**: Against the preferred answer:
     - Check if the actual results contain all required data points with correct values
     - Apply flexible matching for column names, ordering, and formatting
     - Ensure additional columns don't interfere with the preferred answer structure
     - Verify that core data matches substantially (allowing minor rounding)
  5. **Determine Match**: Return Y if the preferred answer matches the actual results, N otherwise

  ### Example Analysis Process
  1. Locate 'createMetrics' and 'updateMetrics' tool calls and extract results data
  2. Compare against the single preferred answer set:
     - Do all the key data points match (with flexibility)?
     - Are all required objects/rows represented correctly?
     - Is ordering correct if the question requires it?
     - Do values match within acceptable tolerances?
  3. Consider whether additional columns complement rather than detract from the preferred answer
  4. Make final determination based on whether the preferred answer matches the actual results

  ### Input
  - The JSON output is: {{output}}
  - The preferred answer is: {{metadata.preferred-answer}}
  - The user's question is: {{input}}

  ### Output
  Return 'Y' if the metric results match the preferred answer (with flexible matching applied).
  Return 'N' if the preferred answer does not match the metric results.
  Return 'Y' if no 'createMetrics' or 'updateMetrics' tool calls are found (nothing to evaluate).
`;

export const doneMessageMatchesSqlResultsPrompt = `
  You are evaluating whether the final response in the 'doneTool' tool call accurately reflects the results of the SQL query executed in the 'createMetrics' tool call. The output is a structured JSON array of messages representing a conversation, including user queries, assistant responses, tool calls, and tool results.
  
  ### Task
  Analyze the output to determine if the 'doneTool' final response correctly represents the top results from the SQL query in the 'createMetrics' tool call. The SQL query results are found in the 'createMetrics' tool result, under 'results'. The final response is in the 'doneTool' tool call's 'final_response' field.
  
  ### Rules for Evaluation
  - **Pass (Y)**: The final response in 'doneTool' accurately summarizes or lists the top results from the SQL query in 'createMetrics'. This means:
    - The top items (e.g., products, quantities) mentioned in the final response match the top records in the SQL query results (in terms of names and values).
    - The response does not include items that are not among the top results or misrepresent the data (e.g., incorrect names, quantities, or rankings).
    - Minor rephrasing or summarization is acceptable, as long as the core information (top items and their values) is correct.
  - **Fail (N)**: The final response in 'doneTool' does not accurately reflect the SQL query results. This includes:
    - Listing items that do not appear in the top results of the SQL query.
    - Misrepresenting quantities or rankings of the top results.
    - Omitting key top results.
    - Including items that contradict the SQL query results (e.g., items explicitly filtered out in the query).
  
  ### Instructions
  1. Locate the 'createMetrics' tool call and its result in the output. Extract the SQL query results from the 'results' field in the tool result.
  2. Locate the 'doneTool' tool call and extract the 'final_response' field.
  3. Compare the items and values mentioned in the 'final_response' with the top results in the SQL query.
  4. Use chain-of-thought reasoning to evaluate:
     - Identify the top items in the SQL query results (e.g., product names and quantities).
     - Check if the 'final_response' mentions these top items accurately.
     - Note any discrepancies (e.g., incorrect items, missing top results, or wrong values).
  5. Return 'Y' if the final response accurately reflects the top SQL query results, 'N' otherwise.
  
  ### Output Structure
  The JSON output is:
  {{output}}
  
  
  ### Output Format
  Your entire response must be a valid JSON object with the following structure:
  {
    "choice": "Y",
    "rationale": "Brief explanation (1-2 sentences)"
  }
  - "choice" must be "Y" or "N".
  - "rationale" must be a concise string (1-2 sentences) explaining your decision.
  - Ensure the JSON is properly formatted and that any special characters in the rationale (e.g., quotes) are correctly escaped.
  - Do not include any text outside of the JSON object.
  Return Y if the condition is met, N if it is not.
  
`;

export const checkUsesExecuteSQLToCreateMetricsPrompt = `
      You are evaluating a conversation between a user, an LLM, and tool calls/results to determine if any SQL query in an 'executeSql' tool call is nearly identical to the SQL query in a 'createMetrics' tool call. The goal is to check for redundant SQL queries where the model unnecessarily runs a query in 'executeSql' that matches the final query used in 'createMetrics'. If no 'executeSql' tool calls are present, the evaluation should return null.
  
      **Evaluation Task:**
      - Examine the JSON output, which is an array of messages representing the conversation.
      - Identify all 'executeSql' tool calls (where 'role' is 'assistant', 'content' contains a 'tool-call' with 'toolName' set to 'executeSql', and 'args.statements' contains SQL queries).
      - Identify all 'createMetrics' tool calls (where 'role' is 'assistant', 'content' contains a 'tool-call' with 'toolName' set to 'createMetrics', and 'args.files' contains 'yml_content' with an SQL query).
      - Compare each SQL query from 'executeSql' tool calls with each SQL query from 'createMetrics' tool calls.
      - Two SQL queries are considered "nearly identical" if they produce the same logical result, ignoring minor syntactic differences (e.g., whitespace, aliases, or order of clauses), but they must have the same tables, joins, conditions, aggregations, and selected columns.
      - If no 'executeSql' tool calls are found, return null.
      - If at least one 'executeSql' query is nearly identical to a 'createMetrics' query, the condition fails (return N).
      - If no 'executeSql' queries match any 'createMetrics' queries, the condition passes (return Y).
  
      **Rules for Pass/Fail:**
      - **Pass (Y, score = 1)**: No 'executeSql' queries are nearly identical to any 'createMetrics' queries, or no 'executeSql' tool calls exist (return null, treated as pass).
      - **Fail (N, score = 0)**: At least one 'executeSql' query is nearly identical to a 'createMetrics' query.
      - **Null Case**: If no 'executeSql' tool calls are present, return null.
  
      **Chain-of-Thought Reasoning:**
      1. Check if any 'executeSql' tool calls exist in the output. If none exist, return null.
      2. Extract all SQL queries from 'executeSql' tool calls (from 'args.statements').
      3. Extract all SQL queries from 'createMetrics' tool calls (from 'args.files[].yml_content' under the 'sql' field).
      4. For each 'executeSql' query, compare it to each 'createMetrics' query to determine if they are nearly identical.
      5. If any pair is nearly identical, return N.
      6. If no pairs are nearly identical, return Y.
  
      **Output Structure:**
      The JSON output is an array of messages, each with 'role', 'content', and other fields. For example:
      - 'executeSql' tool call: {"role": "assistant", "content": [{"type": "tool-call", "toolName": "executeSql", "args": {"statements": ["SELECT ..."]}}]}
      - 'createMetrics' tool call: {"role": "assistant", "content": [{"type": "tool-call", "toolName": "createMetrics", "args": {"files": [{"yml_content": "name: ...\\nsql: |\\n  SELECT ..."}]}}]}
  
      ### Output Format
      Your entire response must be a valid JSON object with the following structure:
      {
        "choice": "Y",
        "rationale": "Brief explanation (1-2 sentences)"
      }
      - "choice" must be "Y", "N", or null.
      - "rationale" must be a concise string (1-2 sentences) explaining your decision.
      - Ensure the JSON is properly formatted and that any special characters in the rationale (e.g., quotes) are correctly escaped.
      - Do not include any text outside of the JSON object.
      Return Y if the condition is met (no duplicate SQL queries), N if it is not (duplicate SQL queries found), or null if no 'executeSql' tool calls exist.
  
      The JSON output is:
      {{output}}
`;
