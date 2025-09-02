export default {
  sourcemap: false,
  rollupConfig: {
    onwarn(warning, defaultHandler) {
      // Suppress "use client" directive warnings
      if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
        return;
      }

      // Suppress legitimate third-party circular dependency warnings
      if (warning.code === "CIRCULAR_DEPENDENCY") {
        const message = warning.message || "";
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

        if (
          message.includes("The 'this' keyword is equivalent to 'undefined'")
        ) {
          return;
        }

        if (warning.code === "THIS_IS_UNDEFINED") {
          const message = warning.message || "";
          // Only suppress for node_modules dependencies
          if (message.includes("node_modules/")) {
            return;
          }
        }
      }
      // Handle all other warnings normally
      defaultHandler(warning);
    },
  },
};
