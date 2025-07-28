import type { FileInput } from '@buster/sandbox';

export interface MockDbtProjectOptions {
  projectName?: string;
  companyName?: string;
  includeDocumentation?: boolean;
  includeTests?: boolean;
  includeMacros?: boolean;
  includeIntermediateModels?: boolean;
  includeMultipleSources?: boolean;
}

export function generateMockDbtProject(options: MockDbtProjectOptions = {}): FileInput[] {
  const {
    projectName = 'analytics',
    companyName = 'SaaSCo',
    includeDocumentation = true,
    includeTests = true,
    includeMacros = true,
    includeIntermediateModels = true,
    includeMultipleSources = true,
  } = options;

  const files: FileInput[] = [];

  // Root configuration files
  files.push({
    path: 'dbt_project.yml',
    content: `name: '${projectName}'
version: '1.0.0'
config-version: 2

profile: '${projectName}'

model-paths: ["models"]
analysis-paths: ["analyses"]
test-paths: ["tests"]
seed-paths: ["data"]
macro-paths: ["macros"]
snapshot-paths: ["snapshots"]

target-path: "target"
clean-targets:
  - "target"
  - "dbt_packages"

models:
  ${projectName}:
    staging:
      +materialized: view
      stripe:
        +schema: staging_stripe
      salesforce:
        +schema: staging_salesforce
      postgres:
        +schema: staging_postgres
    intermediate:
      +materialized: view
      finance:
        +schema: intermediate_finance
      sales:
        +schema: intermediate_sales
    marts:
      +materialized: table
      finance:
        +schema: marts_finance
      sales:
        +schema: marts_sales
      marketing:
        +schema: marts_marketing
`,
  });

  // Root README
  files.push({
    path: 'README.md',
    content: `# ${companyName} Analytics

This is the analytics repository for ${companyName}.

## Overview

This dbt project transforms raw data into analytics-ready datasets.

## Structure

- \`models/staging/\` - Raw data transformations
  - \`stripe/\` - Payment processing data
  - \`salesforce/\` - CRM data
  - \`postgres/\` - Application database data
- \`models/intermediate/\` - Business logic transformations
  - \`finance/\` - Financial calculations
  - \`sales/\` - Sales metrics preparation
- \`models/marts/\` - Business-ready datasets
  - \`finance/\` - Financial reporting
  - \`sales/\` - Sales analytics
  - \`marketing/\` - Marketing analytics

## Setup

1. Install dbt
2. Configure your profile
3. Run \`dbt deps\`
4. Run \`dbt build\`
`,
  });

  // Staging models - Stripe
  files.push({
    path: 'models/staging/stripe/stg_stripe__customers.sql',
    content: `{{
  config(
    materialized='view'
  )
}}

select
    id as customer_id,
    email,
    name as customer_name,
    created as created_at,
    updated as updated_at,
    currency,
    delinquent as is_delinquent,
    balance,
    _sdc_extracted_at
from {{ source('stripe', 'customers') }}
where deleted is false
`,
  });

  files.push({
    path: 'models/staging/stripe/stg_stripe__subscriptions.sql',
    content: `{{
  config(
    materialized='view'
  )
}}

select
    id as subscription_id,
    customer as customer_id,
    status,
    current_period_start,
    current_period_end,
    created as created_at,
    updated as updated_at,
    cancel_at,
    canceled_at,
    trial_start,
    trial_end,
    _sdc_extracted_at
from {{ source('stripe', 'subscriptions') }}
`,
  });

  files.push({
    path: 'models/staging/stripe/stg_stripe__invoices.sql',
    content: `{{
  config(
    materialized='view'
  )
}}

select
    id as invoice_id,
    customer as customer_id,
    subscription as subscription_id,
    status,
    amount_paid,
    amount_due,
    amount_remaining,
    currency,
    created as created_at,
    period_start,
    period_end,
    _sdc_extracted_at
from {{ source('stripe', 'invoices') }}
where status != 'draft'
`,
  });

  files.push({
    path: 'models/staging/stripe/stg_stripe__charges.sql',
    content: `{{
  config(
    materialized='view'
  )
}}

select
    id as charge_id,
    amount,
    amount_refunded,
    currency,
    customer as customer_id,
    description,
    invoice as invoice_id,
    paid as is_paid,
    refunded as is_refunded,
    status,
    created as created_at,
    _sdc_extracted_at
from {{ source('stripe', 'charges') }}
`,
  });

  // Staging models - Salesforce (if multiple sources included)
  if (includeMultipleSources) {
    files.push({
      path: 'models/staging/salesforce/stg_salesforce__accounts.sql',
      content: `{{
  config(
    materialized='view'
  )
}}

select
    id as account_id,
    name as account_name,
    type as account_type,
    industry,
    annual_revenue,
    number_of_employees,
    billing_country,
    billing_state,
    created_date as created_at,
    last_modified_date as updated_at,
    is_deleted
from {{ source('salesforce', 'accounts') }}
where is_deleted = false
`,
    });

    files.push({
      path: 'models/staging/salesforce/stg_salesforce__opportunities.sql',
      content: `{{
  config(
    materialized='view'
  )
}}

select
    id as opportunity_id,
    account_id,
    name as opportunity_name,
    stage_name,
    amount,
    probability,
    close_date,
    type as opportunity_type,
    lead_source,
    is_closed,
    is_won,
    created_date as created_at,
    last_modified_date as updated_at
from {{ source('salesforce', 'opportunities') }}
where is_deleted = false
`,
    });

    files.push({
      path: 'models/staging/salesforce/stg_salesforce__contacts.sql',
      content: `{{
  config(
    materialized='view'
  )
}}

select
    id as contact_id,
    account_id,
    first_name,
    last_name,
    email,
    phone,
    title,
    department,
    created_date as created_at,
    last_modified_date as updated_at
from {{ source('salesforce', 'contacts') }}
where is_deleted = false
`,
    });

    // Staging models - Application Database
    files.push({
      path: 'models/staging/postgres/stg_postgres__users.sql',
      content: `{{
  config(
    materialized='view'
  )
}}

select
    id as user_id,
    email,
    name as user_name,
    role as user_role,
    status as user_status,
    created_at,
    updated_at,
    last_login_at,
    is_active
from {{ source('postgres', 'users') }}
where deleted_at is null
`,
    });

    files.push({
      path: 'models/staging/postgres/stg_postgres__events.sql',
      content: `{{
  config(
    materialized='view'
  )
}}

select
    id as event_id,
    user_id,
    event_type,
    event_properties,
    session_id,
    created_at as event_timestamp
from {{ source('postgres', 'events') }}
`,
    });
  }

  // Intermediate models (if included)
  if (includeIntermediateModels) {
    files.push({
      path: 'models/intermediate/finance/int_revenue_by_month.sql',
      content: `{{
  config(
    materialized='view'
  )
}}

with invoice_revenue as (
    select
        date_trunc('month', period_start) as revenue_month,
        customer_id,
        currency,
        sum(amount_paid) as amount_paid_cents,
        count(distinct invoice_id) as invoice_count
    from {{ ref('stg_stripe__invoices') }}
    where status = 'paid'
    group by 1, 2, 3
)

select
    revenue_month,
    customer_id,
    currency,
    amount_paid_cents / 100.0 as revenue,
    invoice_count
from invoice_revenue
`,
    });

    files.push({
      path: 'models/intermediate/finance/int_subscription_periods.sql',
      content: `{{
  config(
    materialized='view'
  )
}}

with subscription_changes as (
    select
        subscription_id,
        customer_id,
        status,
        created_at,
        canceled_at,
        current_period_start,
        current_period_end,
        lag(status) over (partition by subscription_id order by updated_at) as previous_status
    from {{ ref('stg_stripe__subscriptions') }}
)

select
    subscription_id,
    customer_id,
    status,
    created_at as period_start,
    coalesce(canceled_at, current_period_end) as period_end,
    case
        when previous_status is null then 'new'
        when previous_status != status then 'changed'
        else 'unchanged'
    end as change_type
from subscription_changes
`,
    });

    if (includeMultipleSources) {
      files.push({
        path: 'models/intermediate/sales/int_opportunity_timeline.sql',
        content: `{{
  config(
    materialized='view'
  )
}}

with opportunity_stages as (
    select
        opportunity_id,
        account_id,
        opportunity_name,
        stage_name,
        amount,
        probability,
        close_date,
        created_at,
        updated_at,
        datediff('day', created_at, close_date) as days_to_close,
        datediff('day', created_at, current_date) as days_open
    from {{ ref('stg_salesforce__opportunities') }}
)

select
    *,
    case
        when days_to_close <= 30 then 'quick'
        when days_to_close <= 90 then 'standard'
        else 'long'
    end as sales_cycle_category
from opportunity_stages
`,
      });
    }
  }

  // Marts models - Finance
  files.push({
    path: 'models/marts/finance/fct_mrr.sql',
    content: `{{
  config(
    materialized='table'
  )
}}

with active_subscriptions as (
    select
        customer_id,
        subscription_id,
        current_period_start,
        current_period_end,
        status
    from {{ ref('stg_stripe__subscriptions') }}
    where status in ('active', 'trialing')
),

latest_invoices as (
    select
        subscription_id,
        amount_paid / 100.0 as amount_paid_dollars,
        period_start,
        period_end,
        row_number() over (partition by subscription_id order by created_at desc) as rn
    from {{ ref('stg_stripe__invoices') }}
    where status = 'paid'
)

select
    s.customer_id,
    c.customer_name,
    c.email,
    count(distinct s.subscription_id) as active_subscriptions,
    sum(i.amount_paid_dollars) as mrr,
    min(s.current_period_start) as earliest_subscription_start,
    max(s.current_period_end) as latest_subscription_end
from active_subscriptions s
join {{ ref('stg_stripe__customers') }} c
    on s.customer_id = c.customer_id
left join latest_invoices i
    on s.subscription_id = i.subscription_id
    and i.rn = 1
group by 1, 2, 3
`,
  });

  files.push({
    path: 'models/marts/finance/fct_revenue_metrics.sql',
    content: `{{
  config(
    materialized='table'
  )
}}

with monthly_revenue as (
    select
        date_trunc('month', period_start) as month,
        sum(amount_paid) / 100.0 as revenue
    from {{ ref('stg_stripe__invoices') }}
    where status = 'paid'
    group by 1
),

customer_counts as (
    select
        date_trunc('month', current_period_start) as month,
        count(distinct customer_id) as active_customers
    from {{ ref('stg_stripe__subscriptions') }}
    where status in ('active', 'trialing')
    group by 1
)

select
    r.month,
    r.revenue,
    c.active_customers,
    r.revenue / nullif(c.active_customers, 0) as arpu,
    lag(r.revenue) over (order by r.month) as previous_month_revenue,
    (r.revenue - lag(r.revenue) over (order by r.month)) / 
        nullif(lag(r.revenue) over (order by r.month), 0) * 100 as revenue_growth_pct
from monthly_revenue r
left join customer_counts c
    on r.month = c.month
order by r.month desc
`,
  });

  files.push({
    path: 'models/marts/finance/dim_customers.sql',
    content: `{{
  config(
    materialized='table'
  )
}}

with customer_base as (
    select
        customer_id,
        customer_name,
        email,
        currency,
        is_delinquent,
        created_at,
        updated_at
    from {{ ref('stg_stripe__customers') }}
),

subscription_summary as (
    select
        customer_id,
        count(distinct subscription_id) as total_subscriptions,
        count(distinct case when status = 'active' then subscription_id end) as active_subscriptions,
        min(created_at) as first_subscription_date,
        max(created_at) as latest_subscription_date
    from {{ ref('stg_stripe__subscriptions') }}
    group by 1
),

revenue_summary as (
    select
        customer_id,
        sum(amount_paid) / 100.0 as lifetime_revenue,
        count(distinct invoice_id) as total_invoices,
        max(created_at) as last_payment_date
    from {{ ref('stg_stripe__invoices') }}
    where status = 'paid'
    group by 1
)

select
    c.*,
    coalesce(s.total_subscriptions, 0) as total_subscriptions,
    coalesce(s.active_subscriptions, 0) as active_subscriptions,
    s.first_subscription_date,
    s.latest_subscription_date,
    coalesce(r.lifetime_revenue, 0) as lifetime_revenue,
    coalesce(r.total_invoices, 0) as total_invoices,
    r.last_payment_date,
    case
        when s.active_subscriptions > 0 then 'active'
        when s.total_subscriptions > 0 then 'churned'
        else 'prospect'
    end as customer_status
from customer_base c
left join subscription_summary s on c.customer_id = s.customer_id
left join revenue_summary r on c.customer_id = r.customer_id
`,
  });

  // Marts models - Sales (if multiple sources)
  if (includeMultipleSources) {
    files.push({
      path: 'models/marts/sales/fct_sales_pipeline.sql',
      content: `{{
  config(
    materialized='table'
  )
}}

select
    o.opportunity_id,
    o.account_id,
    a.account_name,
    a.account_type,
    a.industry,
    o.opportunity_name,
    o.stage_name,
    o.amount,
    o.probability,
    o.close_date,
    o.is_closed,
    o.is_won,
    o.created_at,
    datediff('day', o.created_at, current_date) as days_in_pipeline,
    o.amount * (o.probability / 100.0) as weighted_amount
from {{ ref('stg_salesforce__opportunities') }} o
join {{ ref('stg_salesforce__accounts') }} a
    on o.account_id = a.account_id
`,
    });

    files.push({
      path: 'models/marts/sales/dim_accounts.sql',
      content: `{{
  config(
    materialized='table'
  )
}}

with account_metrics as (
    select
        account_id,
        count(distinct opportunity_id) as total_opportunities,
        sum(case when is_won then 1 else 0 end) as won_opportunities,
        sum(case when is_won then amount else 0 end) as total_revenue,
        max(close_date) as last_opportunity_date
    from {{ ref('stg_salesforce__opportunities') }}
    group by 1
)

select
    a.*,
    coalesce(m.total_opportunities, 0) as total_opportunities,
    coalesce(m.won_opportunities, 0) as won_opportunities,
    coalesce(m.total_revenue, 0) as total_revenue,
    m.last_opportunity_date,
    case
        when m.won_opportunities > 0 then 'customer'
        when m.total_opportunities > 0 then 'prospect'
        else 'lead'
    end as account_status
from {{ ref('stg_salesforce__accounts') }} a
left join account_metrics m on a.account_id = m.account_id
`,
    });

    // Marts - Marketing
    files.push({
      path: 'models/marts/marketing/user_engagement_summary.sql',
      content: `{{
  config(
    materialized='table'
  )
}}

with user_events as (
    select
        u.user_id,
        u.email,
        u.user_name,
        u.created_at as user_created_at,
        count(distinct e.event_id) as total_events,
        count(distinct e.session_id) as total_sessions,
        count(distinct date(e.event_timestamp)) as active_days,
        min(e.event_timestamp) as first_event_timestamp,
        max(e.event_timestamp) as last_event_timestamp
    from {{ ref('stg_postgres__users') }} u
    left join {{ ref('stg_postgres__events') }} e
        on u.user_id = e.user_id
    group by 1, 2, 3, 4
),

user_revenue as (
    select
        c.email,
        sum(i.amount_paid) / 100.0 as total_revenue
    from {{ ref('stg_stripe__customers') }} c
    join {{ ref('stg_stripe__invoices') }} i
        on c.customer_id = i.customer_id
    where i.status = 'paid'
    group by 1
)

select
    ue.*,
    coalesce(ur.total_revenue, 0) as total_revenue,
    datediff('day', ue.user_created_at, current_date) as days_since_signup,
    datediff('day', ue.last_event_timestamp, current_date) as days_since_last_activity
from user_events ue
left join user_revenue ur on ue.email = ur.email
`,
    });
  }

  // Staging schema documentation
  if (includeDocumentation) {
    files.push({
      path: 'models/staging/stripe/schema.yml',
      content: `version: 2

sources:
  - name: stripe
    database: raw
    schema: stripe
    tables:
      - name: customers
        description: "Raw customer data from Stripe"
      - name: subscriptions
        description: "Raw subscription data from Stripe"
      - name: invoices
        description: "Raw invoice data from Stripe"
      - name: charges
        description: "Raw charge/payment data from Stripe"

models:
  - name: stg_stripe__customers
    description: "Staged customer data from Stripe"
    columns:
      - name: customer_id
        description: "Unique identifier for the customer"
        tests:
          - unique
          - not_null
      - name: email
        description: "Customer email address"
      - name: customer_name
        description: "Customer full name"

  - name: stg_stripe__subscriptions
    description: "Staged subscription data from Stripe"
    columns:
      - name: subscription_id
        description: "Unique identifier for the subscription"
        tests:
          - unique
          - not_null
      - name: customer_id
        description: "Reference to the customer"
        tests:
          - not_null
          - relationships:
              to: ref('stg_stripe__customers')
              field: customer_id

  - name: stg_stripe__invoices
    description: "Staged invoice data from Stripe"
    columns:
      - name: invoice_id
        description: "Unique identifier for the invoice"
        tests:
          - unique
          - not_null
      
  - name: stg_stripe__charges
    description: "Staged charge data from Stripe"
    columns:
      - name: charge_id
        description: "Unique identifier for the charge"
        tests:
          - unique
          - not_null
`,
    });

    if (includeMultipleSources) {
      files.push({
        path: 'models/staging/salesforce/schema.yml',
        content: `version: 2

sources:
  - name: salesforce
    database: raw
    schema: salesforce
    tables:
      - name: accounts
        description: "Company/account data from Salesforce"
      - name: opportunities
        description: "Sales opportunity data from Salesforce"
      - name: contacts
        description: "Contact data from Salesforce"

models:
  - name: stg_salesforce__accounts
    description: "Staged account data from Salesforce"
    columns:
      - name: account_id
        description: "Unique identifier for the account"
        tests:
          - unique
          - not_null

  - name: stg_salesforce__opportunities
    description: "Staged opportunity data from Salesforce"
    columns:
      - name: opportunity_id
        description: "Unique identifier for the opportunity"
        tests:
          - unique
          - not_null

  - name: stg_salesforce__contacts
    description: "Staged contact data from Salesforce"
    columns:
      - name: contact_id
        description: "Unique identifier for the contact"
        tests:
          - unique
          - not_null
`,
      });

      files.push({
        path: 'models/staging/postgres/schema.yml',
        content: `version: 2

sources:
  - name: postgres
    database: raw
    schema: app
    tables:
      - name: users
        description: "Application user data"
      - name: events
        description: "User event tracking data"

models:
  - name: stg_postgres__users
    description: "Staged user data from application database"
    columns:
      - name: user_id
        description: "Unique identifier for the user"
        tests:
          - unique
          - not_null

  - name: stg_postgres__events
    description: "Staged event data from application database"
    columns:
      - name: event_id
        description: "Unique identifier for the event"
        tests:
          - unique
          - not_null
`,
      });

      files.push({
        path: 'models/staging/salesforce/README.md',
        content: `# Salesforce Staging Models

This directory contains staging models for Salesforce CRM data.

## Source Data
- **accounts**: Company/account records
- **opportunities**: Sales pipeline data
- **contacts**: Individual contact records

## Staging Models
- **stg_salesforce__accounts**: Cleaned and renamed account data
- **stg_salesforce__opportunities**: Standardized opportunity records
- **stg_salesforce__contacts**: Processed contact information
`,
      });

      files.push({
        path: 'models/staging/postgres/README.md',
        content: `# Application Database Staging Models

This directory contains staging models for our main application database.

## Source Data
- **users**: Application user accounts
- **events**: User interaction tracking

## Staging Models
- **stg_postgres__users**: Cleaned user data with soft deletes filtered
- **stg_postgres__events**: Event stream data with consistent timestamps
`,
      });
    }

    files.push({
      path: 'models/staging/stripe/README.md',
      content: `# Stripe Staging Models

This directory contains staging models for Stripe payment data.

## Source Data
- **customers**: Stripe customer records
- **subscriptions**: Subscription lifecycle data
- **invoices**: Invoice and billing data
- **charges**: Individual payment transactions

## Staging Models
- **stg_stripe__customers**: Cleaned customer data with consistent naming
- **stg_stripe__subscriptions**: Subscription records with proper timestamps
- **stg_stripe__invoices**: Invoice data excluding drafts
- **stg_stripe__charges**: Payment transaction records
`,
    });
  }

  // Intermediate documentation
  if (includeDocumentation && includeIntermediateModels) {
    files.push({
      path: 'models/intermediate/finance/schema.yml',
      content: `version: 2

models:
  - name: int_revenue_by_month
    description: "Monthly revenue aggregated by customer"
    columns:
      - name: revenue_month
        description: "Month of the revenue"
      - name: customer_id
        description: "Customer identifier"
      - name: revenue
        description: "Total revenue in dollars for the month"

  - name: int_subscription_periods
    description: "Subscription lifecycle periods with status changes"
    columns:
      - name: subscription_id
        description: "Subscription identifier"
      - name: change_type
        description: "Type of change (new, changed, unchanged)"
`,
    });

    if (includeMultipleSources) {
      files.push({
        path: 'models/intermediate/sales/schema.yml',
        content: `version: 2

models:
  - name: int_opportunity_timeline
    description: "Opportunity timeline analysis with calculated metrics"
    columns:
      - name: opportunity_id
        description: "Opportunity identifier"
      - name: days_to_close
        description: "Number of days from creation to close"
      - name: sales_cycle_category
        description: "Categorization of sales cycle length"
`,
      });
    }

    files.push({
      path: 'models/intermediate/README.md',
      content: `# Intermediate Models

This directory contains business logic transformations that prepare data for final marts.

## Structure
- **finance/**: Financial calculations and aggregations
- **sales/**: Sales metrics and timeline analysis

## Purpose
Intermediate models handle complex business logic that multiple marts may need,
keeping the logic DRY and testable.
`,
    });
  }

  // Marts documentation
  if (includeDocumentation) {
    files.push({
      path: 'models/marts/finance/schema.yml',
      content: `version: 2

models:
  - name: fct_mrr
    description: "Monthly recurring revenue fact table"
    columns:
      - name: customer_id
        description: "Unique customer identifier"
        tests:
          - unique
          - not_null
      - name: mrr
        description: "Monthly recurring revenue in dollars"

  - name: fct_revenue_metrics
    description: "Key revenue metrics by month"
    columns:
      - name: month
        description: "Month of the metrics"
        tests:
          - unique
          - not_null
      - name: revenue
        description: "Total revenue for the month"
      - name: active_customers
        description: "Number of active customers"
      - name: arpu
        description: "Average revenue per user"

  - name: dim_customers
    description: "Customer dimension with enriched attributes"
    columns:
      - name: customer_id
        description: "Unique customer identifier"
        tests:
          - unique
          - not_null
      - name: customer_status
        description: "Current status (active, churned, prospect)"
      - name: lifetime_revenue
        description: "Total revenue from customer all-time"
`,
    });

    if (includeMultipleSources) {
      files.push({
        path: 'models/marts/sales/schema.yml',
        content: `version: 2

models:
  - name: fct_sales_pipeline
    description: "Sales pipeline fact table with opportunity details"
    columns:
      - name: opportunity_id
        description: "Unique opportunity identifier"
        tests:
          - unique
          - not_null
      - name: weighted_amount
        description: "Opportunity amount weighted by probability"

  - name: dim_accounts
    description: "Account dimension with sales metrics"
    columns:
      - name: account_id
        description: "Unique account identifier"
        tests:
          - unique
          - not_null
      - name: account_status
        description: "Status based on opportunity history"
`,
      });

      files.push({
        path: 'models/marts/marketing/schema.yml',
        content: `version: 2

models:
  - name: user_engagement_summary
    description: "User engagement metrics combining product usage and revenue"
    columns:
      - name: user_id
        description: "Unique user identifier"
        tests:
          - unique
          - not_null
      - name: total_revenue
        description: "Revenue attributed to this user"
      - name: days_since_last_activity
        description: "Days since last recorded activity"
`,
      });

      files.push({
        path: 'models/marts/sales/README.md',
        content: `# Sales Data Mart

This folder contains sales analytics models.

## Models

### fct_sales_pipeline
Sales pipeline fact table with all opportunities and their current status.

### dim_accounts
Account dimension enriched with opportunity metrics and status.
`,
      });

      files.push({
        path: 'models/marts/marketing/README.md',
        content: `# Marketing Data Mart

This folder contains marketing and user analytics models.

## Models

### user_engagement_summary
Combines product usage data with revenue to provide a complete view of user engagement.
`,
      });
    }

    files.push({
      path: 'models/marts/finance/README.md',
      content: `# Finance Data Mart

This folder contains financial metrics and reporting models.

## Models

### fct_mrr
Monthly recurring revenue by customer - the key SaaS metric.

### fct_revenue_metrics
Aggregated revenue metrics by month including growth rates.

### dim_customers
Customer dimension with lifetime value and status.
`,
    });
  }

  // Tests
  if (includeTests) {
    files.push({
      path: 'tests/assert_positive_mrr.sql',
      content: `-- Test that all MRR values are positive
select *
from {{ ref('fct_mrr') }}
where mrr < 0
`,
    });

    files.push({
      path: 'tests/assert_revenue_metrics_complete.sql',
      content: `-- Test that we have revenue metrics for all expected months
with expected_months as (
    select distinct date_trunc('month', period_start) as month
    from {{ ref('stg_stripe__invoices') }}
    where status = 'paid'
),

actual_months as (
    select month
    from {{ ref('fct_revenue_metrics') }}
)

select e.month
from expected_months e
left join actual_months a on e.month = a.month
where a.month is null
`,
    });

    if (includeMultipleSources) {
      files.push({
        path: 'tests/assert_opportunity_account_integrity.sql',
        content: `-- Test that all opportunities have valid accounts
select o.*
from {{ ref('stg_salesforce__opportunities') }} o
left join {{ ref('stg_salesforce__accounts') }} a
    on o.account_id = a.account_id
where a.account_id is null
`,
      });
    }
  }

  // Macros
  if (includeMacros) {
    files.push({
      path: 'macros/cents_to_dollars.sql',
      content: `{% macro cents_to_dollars(column_name) %}
    {{ column_name }} / 100.0
{% endmacro %}
`,
    });

    files.push({
      path: 'macros/generate_date_spine.sql',
      content: `{% macro generate_date_spine(start_date, end_date) %}
    {{ dbt_utils.date_spine(
        datepart="day",
        start_date=start_date,
        end_date=end_date
    ) }}
{% endmacro %}
`,
    });
  }

  // Additional project files
  files.push({
    path: '.gitignore',
    content: `target/
dbt_packages/
logs/
.DS_Store
*.log
.env
`,
  });

  files.push({
    path: 'packages.yml',
    content: `packages:
  - package: dbt-labs/dbt_utils
    version: 1.0.0
`,
  });

  return files;
}

// Helper to generate variations of the project
export function generateProjectVariations(): Record<string, FileInput[]> {
  return {
    minimal: generateMockDbtProject({
      includeDocumentation: false,
      includeTests: false,
      includeMacros: false,
      includeIntermediateModels: false,
      includeMultipleSources: false,
    }),
    withoutDocs: generateMockDbtProject({
      includeDocumentation: false,
      includeTests: true,
      includeMacros: true,
      includeIntermediateModels: true,
      includeMultipleSources: true,
    }),
    complete: generateMockDbtProject({
      includeDocumentation: true,
      includeTests: true,
      includeMacros: true,
      includeIntermediateModels: true,
      includeMultipleSources: true,
    }),
  };
}
