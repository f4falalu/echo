import React from 'react';
import { iconProps } from './iconProps';



function imageMountain2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px image mountain 2";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m2.75,3.75c.552,0,1-.448,1-1s-.448-1-1-1-1,.448-1,1,.448,1,1,1Z" fill={secondaryfill} stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m7.774,4.402L1.919,9.037c-.505.4-.222,1.213.422,1.213h7.317c.46,0,.787-.447.649-.885l-1.463-4.634c-.143-.454-.697-.624-1.07-.328h0Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default imageMountain2;