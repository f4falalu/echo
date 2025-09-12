// Export update command components

export {
  getDirectUpdateInstructions,
  getHomebrewUpdateInstructions,
  isInstalledViaHomebrew,
} from './homebrew-detection.js';
export { UpdateCommand } from './update.js';
export {
  getBinaryFileName,
  getBinaryInfo,
  getCurrentVersion,
  updateHandler,
} from './update-handler.js';
export { type UpdateOptions, UpdateOptionsSchema, type UpdateResult } from './update-schemas.js';
