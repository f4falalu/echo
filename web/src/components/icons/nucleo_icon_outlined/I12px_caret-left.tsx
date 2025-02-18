import React from 'react';
import { iconProps } from './iconProps';



function caretLeft(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px caret left";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m2.936,5.376l4.648-3.099c.498-.332,1.166.025,1.166.624v6.197c0,.599-.668.956-1.166.624l-4.648-3.099c-.445-.297-.445-.951,0-1.248Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default caretLeft;