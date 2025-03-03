import React from 'react';
import { iconProps } from './iconProps';



function caretReduceX(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px caret reduce x";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M10.501,9.414l3.468,2.348c.332,.225,.78-.013,.78-.414V6.652c0-.401-.448-.639-.78-.414l-3.468,2.348c-.293,.198-.293,.63,0,.828Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M7.499,9.414l-3.468,2.348c-.332,.225-.78-.013-.78-.414V6.652c0-.401,.448-.639,.78-.414l3.468,2.348c.293,.198,.293,.63,0,.828Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default caretReduceX;