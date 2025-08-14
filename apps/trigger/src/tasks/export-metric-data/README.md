# Export Metric Data Task

This Trigger.dev task exports metric data to CSV format and provides a secure download URL via Cloudflare R2 storage.

## Features

- **Large Dataset Support**: Handles up to 1 million rows
- **CSV Format**: Universal compatibility with Excel, Google Sheets, etc.
- **Secure Downloads**: 60-second presigned URLs for security
- **Automatic Cleanup**: Files are deleted after 60 seconds
- **Memory Efficient**: Streams data without loading entire dataset into memory
- **Multi-Database Support**: Works with all supported data sources (PostgreSQL, MySQL, Snowflake, BigQuery, etc.)

## Configuration

Required environment variables:
```bash
# Cloudflare R2 Storage
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=metric-exports  # Default bucket name
```

## API Usage

### Download Metric Data

```http
GET /api/v2/metric_files/:id/download
Authorization: Bearer <token>
```

#### Response
```json
{
  "downloadUrl": "https://...",  // Presigned URL (expires in 60 seconds)
  "expiresAt": "2024-01-01T12:01:00Z",
  "fileSize": 1048576,
  "fileName": "metric_name_1234567890.csv",
  "rowCount": 5000,
  "message": "Download link expires in 60 seconds. Please start your download immediately."
}
```

#### Error Responses
- `403 Forbidden`: User doesn't have access to the metric
- `404 Not Found`: Metric not found or data source credentials missing
- `400 Bad Request`: Query execution failed
- `504 Gateway Timeout`: Export took longer than 2 minutes

## Task Architecture

### 1. Export Task (`export-metric-data.ts`)
- Fetches metric configuration from database
- Retrieves data source credentials from vault
- Executes SQL query using appropriate adapter
- Converts results to CSV format
- Uploads to R2 with unique key
- Generates 60-second presigned URL
- Schedules cleanup after 60 seconds

### 2. Cleanup Task (`cleanup-export-file.ts`)
- Runs 60 seconds after export
- Deletes file from R2 storage
- Serves as backup to R2 lifecycle rules

### 3. CSV Helpers (`csv-helpers.ts`)
- Properly escapes CSV values
- Handles special characters, quotes, and newlines
- Supports all data types including dates and JSON

## Security

1. **Organization Validation**: Ensures user has access to the metric's organization
2. **Unique Keys**: Each export uses a random 16-byte hex ID
3. **Short-Lived URLs**: 60-second expiration prevents URL sharing
4. **Automatic Cleanup**: Files are deleted after 60 seconds
5. **Private Bucket**: Files are only accessible via presigned URLs

## Limitations

- Maximum 1 million rows per export
- Maximum 500MB file size
- 2-minute timeout for API response
- 5-minute maximum task execution time

## Development

### Running Tests
```bash
npm test export-metric-data
```

### Local Development
1. Set up R2 bucket in Cloudflare dashboard
2. Create R2 API tokens with read/write permissions
3. Add environment variables to `.env`
4. Test with: `curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v2/metrics/<id>/download`

## Monitoring

The task logs key metrics:
- Query execution time
- Row count
- File size
- Upload success/failure
- Presigned URL generation

Check Trigger.dev dashboard for task execution history and logs.