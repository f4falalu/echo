import React from 'react';
import { iconProps } from './iconProps';



function notebookBookmark(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px notebook bookmark";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m7.36,5.36l-1.36-1.36-1.36,1.36c-.236.236-.64.069-.64-.265V.75h4v4.345c0,.334-.404.501-.64.265Z" fill={secondaryfill} strokeWidth="0"/>
		<rect height="8.5" width="10.5" fill="none" rx="2" ry="2" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} transform="rotate(90 6 6)" x=".75" y="1.75"/>
	</g>
</svg>
	);
};

export default notebookBookmark;