import React from 'react';
import { iconProps } from './iconProps';



function circleOpenArrowUpRight(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px circle open arrow up right";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M11.25 11.25L11.25 6.75 6.75 6.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M11.25 6.75L3.873 14.127" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M3.873,14.127c-2.831-2.831-2.831-7.422,0-10.253,2.831-2.831,7.422-2.831,10.253,0s2.831,7.422,0,10.253c-2.075,2.075-5.094,2.629-7.674,1.663" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default circleOpenArrowUpRight;