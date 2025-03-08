export const itemAnimationConfig = {
  initial: { opacity: 0, height: 0 },
  animate: {
    opacity: 1,
    height: 'auto',
    transition: {
      height: {
        type: 'spring',
        stiffness: 400,
        damping: 35,
        mass: 1,
        restDelta: 0.001
      },
      opacity: { duration: 0.2 }
    }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      height: {
        type: 'spring',
        stiffness: 400,
        damping: 35,
        mass: 1,
        restDelta: 0.001
      },
      opacity: { duration: 0.15 }
    }
  }
};
