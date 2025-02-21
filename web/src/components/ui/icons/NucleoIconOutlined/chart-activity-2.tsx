import React from 'react';
import { iconProps } from './iconProps';



function chartActivity2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px chart activity 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M16.25,8.75h-2.297c-.422,0-.798,.265-.941,.661l-1.647,4.575c-.12,.334-.594,.328-.706-.008L7.341,4.022c-.112-.336-.586-.342-.706-.008l-1.647,4.575c-.143,.397-.519,.661-.941,.661H1.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default chartActivity2;