import type { Sandbox } from '@buster/sandbox';

/**
 * Creates a mock sandbox for testing without requiring Daytona API
 */
export function createMockSandbox(): Sandbox {
  const mockId = `mock-sandbox-${Date.now()}`;

  const fileStorage = new Map<string, string | Buffer>();

  const mockSandbox: Sandbox = {
    id: mockId,

    fs: {
      uploadFile: async (content: Buffer | string, path: string) => {
        // Preserve full path structure
        fileStorage.set(path, content);
        return Promise.resolve();
      },

      uploadFiles: async (files: Array<{ source: Buffer; destination: string }>) => {
        for (const file of files) {
          // Preserve full path structure
          fileStorage.set(file.destination, file.source);
        }
        return Promise.resolve();
      },

      createFolder: async (_path: string, _permissions?: string) => {
        // Mock folder creation - folders are implicit in our file storage
        return Promise.resolve();
      },

      readFile: async (path: string) => {
        const content = fileStorage.get(path);
        if (!content) {
          throw new Error(`File not found: ${path}`);
        }
        return content;
      },

      listDirectory: async (path: string) => {
        const normalizedPath = path.endsWith('/') ? path : `${path}/`;
        const files = new Set<string>();

        for (const filePath of fileStorage.keys()) {
          // Check if file is in the requested directory
          if (filePath.startsWith(normalizedPath)) {
            // Get the relative path from the directory
            const relativePath = filePath.slice(normalizedPath.length);
            // Get only the immediate child (file or directory)
            const parts = relativePath.split('/');
            if (parts[0]) {
              files.add(parts[0]);
            }
          }
        }

        return Array.from(files);
      },

      deleteFile: async (path: string) => {
        fileStorage.delete(path);
        return Promise.resolve();
      },

      exists: async (path: string) => {
        // Check if it's a file
        if (fileStorage.has(path)) {
          return true;
        }
        // Check if it's a directory (has files with this prefix)
        const normalizedPath = path.endsWith('/') ? path : `${path}/`;
        for (const filePath of fileStorage.keys()) {
          if (filePath.startsWith(normalizedPath)) {
            return true;
          }
        }
        return false;
      },

      stat: async (path: string) => {
        const exists = fileStorage.has(path);
        if (!exists) {
          throw new Error(`File not found: ${path}`);
        }
        return {
          isFile: true,
          isDirectory: false,
          size: (fileStorage.get(path) as Buffer | string)?.length || 0,
          mtime: new Date(),
        };
      },
    },

    exec: async (command: string) => {
      // Mock command execution with special handling for typescript execution
      if (command.includes('node') && command.includes('.ts')) {
        // This is likely a TypeScript execution from runTypescript
        // Extract the code and execute it
        try {
          // For grep search simulation
          if (command.includes('grep-search')) {
            const searchResults = [];
            for (const [filePath, content] of Array.from(fileStorage.entries())) {
              if (filePath.endsWith('.sql') || filePath.endsWith('.yml')) {
                searchResults.push({
                  success: true,
                  path: filePath,
                  pattern: '.*',
                  matches: [
                    {
                      file: filePath,
                      lineNumber: 1,
                      content: content.toString().split('\n')[0] || '',
                    },
                  ],
                  matchCount: 1,
                });
              }
            }
            return {
              stdout: JSON.stringify(searchResults),
              stderr: '',
              exitCode: 0,
            };
          }

          // For read files simulation
          if (command.includes('read-files')) {
            const results = [];
            // Parse which files are being requested - this is a simplified mock
            for (const [filePath, content] of Array.from(fileStorage.entries())) {
              results.push({
                success: true,
                filePath: filePath,
                content: content.toString(),
                truncated: false,
              });
            }
            return {
              stdout: JSON.stringify(results),
              stderr: '',
              exitCode: 0,
            };
          }
        } catch (error) {
          return {
            stdout: '',
            stderr: error instanceof Error ? error.message : 'Mock execution error',
            exitCode: 1,
          };
        }
      }

      return {
        stdout: `Mock execution of: ${command}`,
        stderr: '',
        exitCode: 0,
      };
    },

    close: async () => {
      // Mock cleanup
      fileStorage.clear();
      return Promise.resolve();
    },

    // Additional mock methods as needed
    process: {
      run: async (command: string) => {
        return {
          stdout: `Mock run: ${command}`,
          stderr: '',
          exitCode: 0,
        };
      },
      codeRun: async (code: string, _options?: Record<string, unknown>, _timeout?: number) => {
        // Mock TypeScript code execution
        try {
          // Handle ls files operations
          if (code.includes('lsFilesConcurrently') || code.includes('ls ')) {
            const results = [];

            // Extract paths from the code
            const pathsMatch = code.match(/const paths = (\[.*?\]);/s);
            if (pathsMatch) {
              const paths = JSON.parse(pathsMatch[1]);

              for (const requestedPath of paths) {
                const normalizedPath = requestedPath.endsWith('/')
                  ? requestedPath.slice(0, -1)
                  : requestedPath;
                const entries: Array<{ name: string; type: string; size?: string }> = [];

                // Check if path exists as a directory
                let isDirectory = false;
                const dirPath = normalizedPath.endsWith('/')
                  ? normalizedPath
                  : `${normalizedPath}/`;

                for (const filePath of fileStorage.keys()) {
                  if (filePath.startsWith(dirPath) || filePath === normalizedPath) {
                    isDirectory = true;
                    break;
                  }
                }

                if (!isDirectory && !fileStorage.has(normalizedPath)) {
                  results.push({
                    success: false,
                    path: requestedPath,
                    error: 'Path not found',
                  });
                  continue;
                }

                // List files in directory
                for (const [filePath, content] of Array.from(fileStorage.entries())) {
                  if (filePath.startsWith(dirPath) && filePath !== normalizedPath) {
                    const relativePath = filePath.slice(dirPath.length);
                    const parts = relativePath.split('/');
                    if (parts[0] && !entries.find((e) => e.name === parts[0])) {
                      const entry: { name: string; type: string; size?: string } = {
                        name: parts[0],
                        type: parts.length > 1 ? 'directory' : 'file',
                      };
                      if (parts.length === 1) {
                        entry.size = content.toString().length.toString();
                      }
                      entries.push(entry);
                    }
                  } else if (filePath === normalizedPath) {
                    // It's a file
                    entries.push({
                      name: filePath.split('/').pop() || filePath,
                      type: 'file',
                      size: content.toString().length.toString(),
                    });
                  }
                }

                results.push({
                  success: true,
                  path: requestedPath,
                  entries: entries.length > 0 ? entries : undefined,
                });
              }
            }

            return {
              result: JSON.stringify(results),
              stderr: '',
              exitCode: 0,
            };
          }

          // Simple pattern matching for grep search code
          if (code.includes('executeGrepSearch') || code.includes('grep')) {
            const searchResults = [];

            // Check if searching in dbt_project directory
            const pathMatch = code.match(/path:\s*["']([^"']+)["']/);
            const searchPath = pathMatch ? pathMatch[1] : '.';

            for (const [filePath, content] of Array.from(fileStorage.entries())) {
              // Only include files that match the search path
              if (searchPath === '.' || (searchPath && filePath.startsWith(searchPath))) {
                if (filePath.endsWith('.sql') || filePath.endsWith('.yml')) {
                  searchResults.push({
                    success: true,
                    path: searchPath,
                    pattern: '.*',
                    matches: [
                      {
                        file: filePath,
                        lineNumber: 1,
                        content: content.toString().split('\n')[0] || '',
                      },
                    ],
                    matchCount: 1,
                  });
                }
              }
            }

            return {
              result: JSON.stringify(searchResults),
              stderr: '',
              exitCode: 0,
            };
          }

          // Simple pattern matching for read files code
          if (code.includes('readFile') || code.includes('readFiles')) {
            const results = [];

            // Try to extract file paths from the code
            const filePathMatches = code.matchAll(/["']([^"']+\.(sql|yml|md))["']/g);
            const requestedFiles = Array.from(filePathMatches).map((match) => match[1]);

            if (requestedFiles.length > 0) {
              // Return specific files requested
              for (const requestedFile of requestedFiles) {
                if (requestedFile) {
                  const content = fileStorage.get(requestedFile);
                  if (content) {
                    results.push({
                      success: true,
                      filePath: requestedFile,
                      content: content.toString(),
                      truncated: false,
                    });
                  } else {
                    results.push({
                      success: false,
                      filePath: requestedFile,
                      error: `File not found: ${requestedFile}`,
                    });
                  }
                }
              }
            } else {
              // Return all files if no specific files requested
              for (const [filePath, content] of Array.from(fileStorage.entries())) {
                results.push({
                  success: true,
                  filePath: filePath,
                  content: content.toString(),
                  truncated: false,
                });
              }
            }

            return {
              result: JSON.stringify(results),
              stderr: '',
              exitCode: 0,
            };
          }

          // Simple pattern matching for create/edit files code
          if (
            code.includes('writeFile') ||
            code.includes('createFile') ||
            code.includes('fs.write')
          ) {
            // Simulate successful file creation
            return {
              result: JSON.stringify({
                success: true,
                message: 'Files created successfully',
                filesCreated: 1,
              }),
              stderr: '',
              exitCode: 0,
            };
          }

          // Default mock response
          return {
            result: 'Mock TypeScript execution completed',
            stderr: '',
            exitCode: 0,
          };
        } catch (error) {
          return {
            result: '',
            stderr: error instanceof Error ? error.message : 'Mock execution error',
            exitCode: 1,
          };
        }
      },
    },
  } as unknown as Sandbox;

  return mockSandbox;
}
