# GitHub Token Support in Sandbox

The sandbox now supports passing GitHub tokens to enable authenticated git operations within the sandboxed environment.

## Usage

### From AI Workflows

When running AI workflows that need to perform git operations with GitHub repositories, you can provide a GitHub token to the sandbox:

```typescript
import { 
  createSandboxWithGitHubToken, 
  setGitHubTokenInContext 
} from '@buster/ai';
import { RuntimeContext } from '@mastra/core/runtime-context';

// Option 1: Create sandbox with GitHub token
const runtimeContext = new RuntimeContext();
const githubToken = await getInstallationTokenByOrgId(organizationId);
const sandbox = await createSandboxWithGitHubToken(runtimeContext, githubToken);

// Option 2: Add token to existing context
setGitHubTokenInContext(runtimeContext, githubToken);
```

### Direct Sandbox Usage

When using the sandbox directly, pass the GitHub token as an environment variable:

```typescript
import { runTypescript } from '@buster/sandbox';

const code = `
  // Your TypeScript code that needs GitHub access
  const token = process.env.GITHUB_TOKEN;
  console.log('Token available:', !!token);
`;

const result = await runTypescript(sandbox, code, {
  env: { GITHUB_TOKEN: 'ghs_your_token_here' }
});
```

## Git Operations with Token

Once the GITHUB_TOKEN is available in the sandbox environment, it can be used for authenticated git operations:

### Cloning Private Repositories
```bash
git clone https://x-access-token:${GITHUB_TOKEN}@github.com/owner/repo.git
```

### Configuring Git User
```bash
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
```

### Pushing Changes
```bash
git remote set-url origin https://x-access-token:${GITHUB_TOKEN}@github.com/owner/repo.git
git push origin main
```

## Integration with GitHub OAuth

The GitHub token can be obtained from the GitHub integration:

```typescript
import { getInstallationTokenByOrgId } from '@apps/server/github/services';

// Fetch token for organization
const tokenResponse = await getInstallationTokenByOrgId(organizationId);
const githubToken = tokenResponse.token;

// Pass to sandbox
const sandbox = await createSandboxWithGitHubToken(runtimeContext, githubToken);
```

## Security Considerations

- Tokens are only available within the sandboxed environment
- Tokens expire after 1 hour (GitHub installation tokens)
- Never log or expose tokens in output
- Tokens are passed securely through environment variables

## Supported Tools

The following AI tools automatically use the GitHub token when available in the runtime context:

- `bash-execute-tool` - Passes GITHUB_TOKEN to bash commands run in sandbox
- Other file tools can access the token via `process.env.GITHUB_TOKEN` when running in sandbox mode