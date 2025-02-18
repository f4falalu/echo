import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_heart2Half(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px heart 2 half";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9,4.926s0,0,0,.001c.171-.353,.396-.677,.666-.962,1.451-1.528,3.867-1.591,5.395-.139,1.528,1.451,1.59,3.867,.139,5.395l-5.48,5.694c-.197,.205-.459,.307-.721,.307" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M9,4.926s0,0,0,.001c-.171-.353-.396-.677-.666-.962-1.451-1.528-3.867-1.591-5.395-.139-1.528,1.451-1.59,3.867-.139,5.395l5.48,5.694c.197,.205,.459,.307,.721,.307V4.926Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_heart2Half;