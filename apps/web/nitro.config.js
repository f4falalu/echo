// Configuration for warning suppressions - easily extensible
const WARNING_SUPPRESSIONS = {
  MODULE_LEVEL_DIRECTIVE: {
    patterns: ["node_modules/"],
    reason: "Suppress 'use client' directive warnings from dependencies"
  },
  THIS_IS_UNDEFINED: {
    patterns: ["node_modules/"],
    reason: "Suppress 'this' keyword warnings in ES modules from dependencies"
  },
  CIRCULAR_DEPENDENCY: {
    patterns: [
      "nitropack/dist/runtime/internal/",
      "@tanstack/store/dist",
      "juice/lib/"
    ],
    reason: "Suppress known third-party circular dependency warnings"
  }
};

// Additional message-based suppressions
const MESSAGE_SUPPRESSIONS = [
  "The 'this' keyword is equivalent to 'undefined'"
];

function shouldSuppressWarning(warning) {
  const message = warning.message || "";
  
  // Check code-based suppressions
  const suppression = WARNING_SUPPRESSIONS[warning.code];
  if (suppression) {
    return suppression.patterns.some(pattern => message.includes(pattern));
  }
  
  // Check message-based suppressions
  return MESSAGE_SUPPRESSIONS.some(suppressionMessage => 
    message.includes(suppressionMessage)
  );
}

export default {
  // rollupConfig: {
  //   onwarn(warning, defaultHandler) {
  //     if (shouldSuppressWarning(warning)) {
  //       return;
  //     }
      
  //     // Handle all other warnings normally
  //     defaultHandler(warning);
  //   },
  //   onerror: (id) => {
  //     console.error(`Big nate: Error in ${id}`);
  //   },
  // },
};
