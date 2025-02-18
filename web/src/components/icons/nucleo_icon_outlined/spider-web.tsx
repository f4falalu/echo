import React from 'react';
import { iconProps } from './iconProps';



function spiderWeb(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px spider web";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M3.338,5.743c.327,.841,.614,1.947,.614,3.257,0,.598-.06,1.833-.613,3.256l.009,.019c.892,.137,1.993,.441,3.128,1.096,.518,.299,1.557,.968,2.514,2.159l.021,.002c.564-.704,1.379-1.506,2.514-2.161,.518-.299,1.617-.865,3.127-1.097l.012-.017c-.327-.841-.614-1.947-.614-3.257,0-.598,.06-1.833,.613-3.256l-.009-.019c-.892-.137-1.993-.441-3.128-1.096-.518-.299-1.557-.968-2.514-2.159l-.021-.002c-.564,.704-1.379,1.506-2.514,2.161-.518,.299-1.617,.865-3.127,1.097l-.012,.017Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M9 1.25L9 16.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M15.712 5.125L2.288 12.875" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M15.712 12.875L2.288 5.125" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default spiderWeb;