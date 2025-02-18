import React from 'react';
import { iconProps } from './iconProps';



function cloudDownload2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px cloud download 2";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M6 5.75L6 11" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m10.607,7.41c.396-.442.643-1.02.643-1.66,0-1.381-1.119-2.5-2.5-2.5-.243,0-.473.046-.695.11-.485-1.51-1.884-2.61-3.555-2.61C2.429.75.75,2.429.75,4.5c0,.963.374,1.833.971,2.497" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M8.5 8.75L6 11.25 3.5 8.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default cloudDownload2;