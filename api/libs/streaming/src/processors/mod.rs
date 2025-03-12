//! Specialized processors for different types of streaming content

// Re-export all processors for easier access
mod dashboard;
mod metric;
mod plan;
mod search;

pub use dashboard::DashboardProcessor;
pub use metric::MetricProcessor;
pub use plan::PlanProcessor;
pub use search::SearchProcessor;
