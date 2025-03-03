import React from 'react';
import { iconProps } from './iconProps';



function caretExpandY(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px caret expand y";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M8.586,3.001l-2.348,3.468c-.225,.332,.013,.78,.414,.78h4.696c.401,0,.639-.448,.414-.78l-2.348-3.468c-.198-.293-.63-.293-.828,0Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M8.586,14.999l-2.348-3.468c-.225-.332,.013-.78,.414-.78h4.696c.401,0,.639,.448,.414,.78l-2.348,3.468c-.198,.293-.63,.293-.828,0Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default caretExpandY;