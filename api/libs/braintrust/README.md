# Braintrust Client Library

A Rust client library for interacting with the [Braintrust](https://braintrust.dev) API, allowing for logging of spans and traces to track AI application performance.

## Features

- Asynchronous logging of spans to Braintrust
- Hierarchical tracing with parent-child relationships
- Automatic timing and duration calculation
- Token counting for LLM calls
- Custom metadata and attributes
- Background logging with non-blocking API

## Usage

Add the library to your project's dependencies:

```toml
[dependencies]
braintrust = { path = "../libs/braintrust" }
```

### Basic Example

```rust
use braintrust::{BraintrustClient, TraceBuilder};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize the client with your API key and project ID
    let client = BraintrustClient::new("YOUR_API_KEY", "YOUR_PROJECT_ID");
    
    // Create a trace for the entire process
    let trace = TraceBuilder::new(client.clone(), "My AI Application");
    
    // Create a span for an LLM call
    let mut span = trace.add_span("GPT-4 Call", "llm").await?;
    
    // Update the span with input and output
    span = span
        .set_input(json!({
            "messages": [{"role": "user", "content": "Hello, world!"}]
        }))
        .set_output(json!({
            "choices": [{"message": {"role": "assistant", "content": "Hi there!"}}]
        }))
        .set_tokens(10, 5)
        .add_metadata("model", "gpt-4");
    
    // Log the updated span
    client.log_span(span).await?;
    
    // Finish the trace
    trace.finish().await?;
    
    Ok(())
}
```

### Creating Spans

Spans represent a single operation or step in your application. You can create spans directly or through a `TraceBuilder`:

```rust
// Create a span directly
let span = Span::new("My Operation", "function", "root_span_id", Some("parent_span_id"));

// Or create a span through a trace builder
let span = trace.add_span("My Operation", "function").await?;

// Create a child span with a parent reference
let child_span = trace.add_child_span("Child Operation", "function", &parent_span).await?;
```

### Updating Spans

Spans are immutable, but methods return a new span with updated fields:

```rust
let updated_span = span
    .set_input(json!({ "key": "value" }))
    .set_output(json!({ "result": "success" }))
    .set_tokens(50, 30)
    .add_metadata("important_context", "some value");
```

### Logging Spans

Spans can be logged asynchronously (non-blocking) or synchronously:

```rust
// Asynchronous logging (non-blocking)
client.log_span(span).await?;

// Synchronous logging (waits for API response)
client.log_span_sync(span).await?;
```

## Advanced Usage

See the examples directory for more advanced usage patterns:

- `basic_usage.rs`: Simple example of logging spans and traces
- `conversation_tracking.rs`: Example of tracking a conversation with LLM calls

## Testing

Run the tests with:

```bash
cargo test -p braintrust
```

## License

MIT
