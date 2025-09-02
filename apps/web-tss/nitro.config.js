export default {
  sourcemap: false,
  rollupConfig: {
    onwarn(warning, defaultHandler) {
      const message = warning.message || "";

      // Suppress "use client" directive warnings
      if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
        if (message.includes("node_modules/")) {
          return;
        }
      }

      // Suppress 'this' keyword warnings in ES modules
      if (warning.code === "THIS_IS_UNDEFINED") {
        // Only suppress for node_modules dependencies
        if (message.includes("node_modules/")) {
          return;
        }
      }

      // Also suppress by message content for broader coverage
      if (message.includes("The 'this' keyword is equivalent to 'undefined'")) {
        return;
      }

      // Suppress legitimate third-party circular dependency warnings
      if (warning.code === "CIRCULAR_DEPENDENCY") {
        // Suppress nitropack internal circular dependencies (framework issue)
        if (message.includes("nitropack/dist/runtime/internal/")) {
          return;
        }
        // Suppress TanStack store internal circular dependencies (library issue)
        if (message.includes("@tanstack/store/dist")) {
          return;
        }

        // Suppress juice library circular dependencies (library issue)
        if (message.includes("juice/lib/")) {
          return;
        }
      }

      // Handle all other warnings normally
      defaultHandler(warning);
    },
  },
};
