export const itemAnimationConfig = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.575 } }, // Keep the animate duration the same
  exit: { opacity: 0, transition: { duration: 0.4 } } // Updated only the exit animation duration to 0.4
};
