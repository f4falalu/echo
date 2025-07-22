export type MarkdownAnimation =
  | 'fadeIn'
  | 'slideUp'
  | 'wave'
  | 'elastic'
  | 'bounceIn'
  | 'rotateIn'
  | 'colorTransition'
  | 'fadeAndScale'
  | 'slideInFromLeft'
  | 'blurIn'
  | 'typewriter'
  | 'highlight'
  | 'blurAndSharpen'
  | 'dropIn'
  | 'none';

export type MarkdownAnimationTimingFunction = 'ease-in-out' | 'ease-out' | 'ease-in' | 'linear';

export const animations: Record<MarkdownAnimation, string> = {
  fadeIn: 'animated-md-fadeIn',
  slideUp: 'animated-md-slideUp',
  wave: 'animated-md-wave',
  elastic: 'animated-md-elastic',
  bounceIn: 'animated-md-bounceIn',
  rotateIn: 'animated-md-rotateIn',
  colorTransition: 'animated-md-colorTransition',
  fadeAndScale: 'animated-md-fadeAndScale',
  slideInFromLeft: 'animated-md-slideInFromLeft',
  blurIn: 'animated-md-blurIn',
  typewriter: 'animated-md-typewriter',
  highlight: 'animated-md-highlight',
  blurAndSharpen: 'animated-md-blurAndSharpen',
  dropIn: 'animated-md-dropIn',
  none: 'none'
};

interface AnimationStyleProps {
  animation?: MarkdownAnimation;
  animationDuration?: number;
  isStreamFinished?: boolean;
  animationTimingFunction?: MarkdownAnimationTimingFunction;
}

export const createAnimationStyle = ({
  animation = 'fadeIn',
  animationDuration = 700,
  animationTimingFunction = 'ease-in-out',
  isStreamFinished = false
}: AnimationStyleProps) => {
  if (animation === 'none' || isStreamFinished) {
    return { animation: 'none' };
  }

  return {
    animation: `${animations[animation]} ${animationDuration}ms ${animationTimingFunction}`
  };
};
