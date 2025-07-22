export declare function loadRootEnv(): void;
export interface EnvValidationResult {
    hasErrors: boolean;
    missingVariables: string[];
}
export interface EnvValidationOptions {
    skipInCI?: boolean;
    skipInProduction?: boolean;
    skipInDocker?: boolean;
}
export declare function validateEnv(requiredVars: Record<string, string | undefined>, options?: EnvValidationOptions): EnvValidationResult;
export declare function createValidateEnvScript(requiredEnvVars: string[]): string;
//# sourceMappingURL=index.d.ts.map