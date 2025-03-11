# PRD Template
<!-- 
This template is designed to help you create comprehensive Product Requirements Documents (PRDs).
Key points to remember:
- Be specific and detailed in each section
- Include technical details where relevant
- Consider all stakeholders
- Think about edge cases and potential issues
- Document assumptions and dependencies
-->

## Problem Statement ✅
<!-- 
Clearly articulate the problem you're solving. Include:
- Current state
- Pain points
- Impact on users/system
- Why it needs to be solved now
- Any relevant metrics or data
-->

The current Buster CLI's `deploy` command and the API's deployment endpoint have diverged in their handling of dataset creation and validation. The CLI supports advanced features like:
1. Global configuration via buster.yml
2. Model-level overrides
3. Searchable dimensions (stored values)
4. Cross-project entity relationships

This misalignment can cause deployment inconsistencies and confusion for users.

Key issues:
- Configuration handling differs between CLI and API
- Stored values flag naming inconsistency (searchable vs stored_values)
- Entity relationships handled differently
- Success/failure reporting differences
- Validation scope misalignment

### Current Limitations
<!-- List specific limitations or issues in the current system -->
- [Limitation 1]
- [Limitation 2]
- ...

### Impact
<!-- Describe the impact of not solving this problem -->
- User Impact: [Describe]
- System Impact: [Describe]
- Business Impact: [Describe]

## Requirements

### Functional Requirements ✅
<!-- 
List all functional requirements. Each should be:
- Specific
- Measurable
- Achievable
- Relevant
- Time-bound
-->

#### Core Functionality
- Requirement 1
  - Details:
  - Acceptance Criteria:
  - Dependencies:

#### User Interface
- Requirement 1
  - Details:
  - Acceptance Criteria:
  - Dependencies:

#### Data Management
- Requirement 1
  - Details:
  - Acceptance Criteria:
  - Dependencies:

### Non-Functional Requirements ✅
<!-- 
Include requirements for:
- Performance
- Security
- Scalability
- Maintainability
- Reliability
-->

- Performance Requirements
  - [Specific metrics]
- Security Requirements
  - [Security considerations]
- Scalability Requirements
  - [Scalability expectations]

## Technical Design ✅

### System Architecture
<!-- 
Describe the high-level architecture:
- Components
- Interactions
- Data flow
- System boundaries
-->

```mermaid
graph TD
    A[Component A] --> B[Component B]
    B --> C[Component C]
    // Add your architecture diagram
```

### Core Components ✅
<!-- 
For each component, include:
- Purpose
- Responsibilities
- Interfaces
- Dependencies
-->

#### Component 1: [Name]
```rust
// Include actual code structures/types
struct ComponentName {
    // Include fields and their purposes
    field1: Type1,    // Purpose of field1
    field2: Type2,    // Purpose of field2
}

// Include relevant methods/functions
impl ComponentName {
    // Document method purpose and behavior
    fn method1() -> Result<Type, Error> {
        // Implementation details
    }
}
```

### Database Changes (If applicable)
<!-- 
Document all database changes:
- New tables
- Modified tables
- Migrations
- Indexes
-->

```sql
-- Include actual SQL for schema changes
CREATE TABLE new_table (
    id UUID PRIMARY KEY,
    -- Document each column's purpose
    column1 TYPE1,  -- Purpose of column1
    column2 TYPE2   -- Purpose of column2
);

-- Include indexes
CREATE INDEX idx_name ON table_name(column_name);
```

### API Changes (If applicable)
<!-- 
Document all API changes:
- New endpoints
- Modified endpoints
- Request/Response structures
- Authentication/Authorization changes
-->

```rust
// Document new/modified API structures
struct NewRequest {
    field1: Type1,    // Purpose and validation requirements
    field2: Type2,    // Purpose and validation requirements
}

struct NewResponse {
    field1: Type1,    // Purpose and possible values
    field2: Type2,    // Purpose and possible values
}
```

### File Changes (If applicable)
<!-- 
List all files that will be:
- Created
- Modified
- Deleted
Include the purpose of each change
-->

#### New Files
- `src/new_module/new_file.rs`
  - Purpose: [Describe purpose]
  - Key components: [List key components]
  - Dependencies: [List dependencies]

#### Modified Files
- `src/existing_module/existing_file.rs`
  - Changes: [Describe changes]
  - Impact: [Describe impact]
  - Dependencies: [List dependencies]

#### Deleted Files
- `src/old_module/old_file.rs`
  - Reason for deletion: [Explain why]
  - Impact: [Describe impact]
  - Migration plan: [Describe how to handle deletion]

## Implementation Plan

<!-- 
Break down the implementation into phases:
- Each phase should be independently deployable
- Include clear success criteria
- List dependencies between phases
- Include testing strategy for each phase
-->

### Phase 1: Configuration Alignment ⏳ (In Progress)

1. Update request mapping
   - [x] Add yml_file field to DeployDatasetsRequest
   - [x] Update stored_values mapping from searchable ✅
   - [x] Add schema and data_source_name resolution from buster.yml ✅

2. Implement config resolution
   - [x] Honor model-level overrides ✅
   - [x] Support buster.yml fallbacks ✅
   - [x] Add validation for required fields ✅

3. Add yml content preservation
   - [x] Store complete YML in dataset record ✅
   - [x] Add YML validation ✅
   - [x] Ensure proper escaping/formatting ✅

### Phase 2: Testing & Documentation 🔜 (Not Started)

1. Add comprehensive tests
   - [ ] Unit tests for config resolution
   - [ ] Integration tests for deployment flow
   - [ ] Error scenario tests
   - [ ] Validation tests

2. Update documentation
   - [ ] API endpoint documentation
   - [ ] Request/response format docs
   - [ ] Configuration precedence docs
   - [ ] Error handling docs

3. Add migration guide
   - [ ] Document breaking changes
   - [ ] Provide upgrade steps
   - [ ] Add examples

(You can use as many phases as you deem relevant.)
### Phase 3:....

### Phase 4:....

### Phase 5:....

## Testing Strategy ✅

### Unit Tests
<!-- 
Detail unit testing approach:
- Test scenarios
- Edge cases
- Mocking strategy
-->

#### Component 1 Tests
```rust
#[cfg(test)]
mod tests {
    // Document test purpose and scenarios
    #[test]
    fn test_scenario_1() {
        // Test implementation
    }
}
```

### Integration Tests
<!-- 
Detail integration testing approach:
- Test scenarios
- System interactions
- Data flow validation
-->

#### Scenario 1: [Description]
- Setup: [Describe test setup]
- Steps: [List test steps]
- Expected Results: [Describe expected outcome]
- Validation Criteria: [List validation points]

### Security Considerations
<!-- Detail security implications -->
- Security Requirement 1
  - Description: [Describe requirement]
  - Implementation: [How it's implemented]
  - Validation: [How it's validated]

### Performance Considerations
<!-- Detail performance implications -->
- Performance Requirement 1
  - Description: [Describe requirement]
  - Implementation: [How it's implemented]
  - Validation: [How it's validated]

### References
<!-- Include relevant documentation -->
- [Link to relevant docs]
- [Link to related PRDs]
- [Link to design docs] 