import React from 'react';
import { iconProps } from './iconProps';



function caretDownToLine(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px caret down to line";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M14.75 15.25L3.25 15.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M9.845,11.668l4.682-7.383c.422-.666-.056-1.536-.845-1.536H4.318c-.788,0-1.267,.87-.845,1.536l4.682,7.383c.393,.619,1.296,.619,1.689,0Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default caretDownToLine;