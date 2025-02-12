# Buster CLI

A powerful command-line interface for managing semantic models in Buster. Deploy and manage your data models with ease, whether they're standalone or part of a dbt project.

## Features

- 🚀 Deploy semantic models directly from YAML files
- 🔄 Two-way compatibility with dbt projects
- 🎯 Simple configuration with smart defaults
- 📊 Support for dimensions, measures, and relationships
- 🛠️ Automatic SQL view generation
- 📝 Clear error reporting and validation

## Installation

```bash
cargo install buster-cli
```

## Quick Start

1. **Authentication**

   Get your API key from [Buster Platform](https://platform.buster.so/app/settings/api-keys) and authenticate:

   ```bash
   buster auth
   ```

2. **Project Setup**

   Initialize a new project:

   ```bash
   buster init
   ```

   This will:
   - Create a `buster.yml` configuration file
   - Set up the recommended directory structure
   - Configure your data source connection

3. **Deploy Models**

   ```bash
   buster deploy
   ```

## Project Structure

```
your-project/
├── buster.yml          # Global configuration
├── models/            # Your semantic model definitions
│   ├── customers.yml
│   ├── orders.yml
│   └── products.yml
└── sql/              # SQL definitions (optional)
    ├── customers.sql
    ├── orders.sql
    └── products.sql
```

## Configuration

### Global Configuration (buster.yml)

```yaml
# buster.yml
data_source_name: "my_warehouse"  # Your default data source
schema: "analytics"               # Default schema for models
```

### Model Definition (models/*.yml)

```yaml
# models/customers.yml
version: 1
models:
  - name: customers
    description: "Core customer data model"
    data_source_name: "my_warehouse"  # Optional, overrides global
    schema: "analytics"               # Optional, overrides global
    
    # Define entities (for relationships)
    entities:
      - name: customer_id
        expr: "id"
        type: "primary"
        description: "Primary customer identifier"
    
    # Define dimensions
    dimensions:
      - name: email
        expr: "email"
        type: "string"
        description: "Customer email address"
      - name: signup_date
        expr: "created_at::date"
        type: "date"
        description: "Date when customer signed up"
        searchable: true  # Enable value caching
    
    # Define measures
    measures:
      - name: total_customers
        expr: "customer_id"
        agg: "count_distinct"
        description: "Total number of unique customers"
```

### SQL Definition (sql/*.sql)

```sql
-- sql/customers.sql
SELECT 
  id as customer_id,
  email,
  created_at
FROM raw.customers
WHERE deleted_at IS NULL
```

## Commands

### `buster deploy`

Deploy your semantic models to Buster.

```bash
# Deploy all models in the current directory
buster deploy

# Deploy a specific model
buster deploy models/customers.yml

# Deploy models in a specific directory
buster deploy models/
```

The deploy command will:
1. Find and validate all model files
2. Locate corresponding SQL files
3. Generate default SQL if none exists
4. Deploy to Buster with proper error handling

### `buster auth`

Manage your Buster authentication.

```bash
# Set up authentication
buster auth

# View current auth status
buster auth status

# Clear authentication
buster auth clear
```

### `buster init`

Initialize a new Buster project.

```bash
# Initialize in current directory
buster init

# Initialize in a specific directory
buster init my-project/
```

## Model Features

### Entity Relationships

Link models together using entity relationships:

```yaml
# models/orders.yml
models:
  - name: orders
    entities:
      - name: customers  # References customers.yml
        expr: "customer_id"
        type: "foreign"
        description: "Link to customer"
```

### Stored Values

Enable value caching for better performance:

```yaml
dimensions:
  - name: country
    expr: "country_code"
    type: "string"
    searchable: true  # Values will be cached
```

### Default SQL Generation

If no SQL file exists, Buster generates a default SELECT statement:

```sql
SELECT * FROM schema.model_name
```

## Error Handling

The CLI provides clear error messages for common issues:

- Missing required fields
- Invalid relationships
- SQL syntax errors
- API communication issues
- Authentication problems

Example error output:
```
❌ Error processing customers.yml: data_source_name is required
⚠️  Warning: No SQL file found for 'customers', using default SELECT
```

## Best Practices

1. **Organization**
   - Keep YAML files in `models/`
   - Keep SQL files in `sql/`
   - Use `buster.yml` for shared settings

2. **Naming**
   - Use descriptive model names
   - Match SQL and YAML file names
   - Use lowercase with underscores

3. **Documentation**
   - Add descriptions to all models
   - Document dimensions and measures
   - Explain relationships

4. **SQL**
   - Keep SQL simple and focused
   - Use CTEs for complex logic
   - Add comments for clarity

## Known Limitations

- SQL files must be one directory up from YAML files
- Environment is fixed to "dev"
- No automatic relationship creation
- Simple SQL fallback may not suit all cases

## Troubleshooting

### Common Issues

1. **"Data source not found"**
   - Verify data source exists in Buster
   - Check data_source_name in config
   - Ensure env='dev' is set

2. **"SQL file not found"**
   - Check SQL file location
   - Verify file naming matches
   - Consider using default SQL

3. **"Invalid relationship"**
   - Verify referenced model exists
   - Check entity name matches
   - Ensure proper file structure

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.
