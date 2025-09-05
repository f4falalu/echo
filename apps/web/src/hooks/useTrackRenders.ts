import { useRef } from 'react';

export const useTrackRenders = ({ name }: { name: string }) => {
  const rendersRef = useRef(0);

  rendersRef.current++;

  console.log(`${name} renders: ${rendersRef.current}`);

  return rendersRef.current;
};
