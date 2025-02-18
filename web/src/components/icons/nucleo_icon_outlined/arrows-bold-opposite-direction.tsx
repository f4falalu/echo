import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_arrowsBoldOppositeDirection(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px arrows bold opposite direction";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9.65,4.75h-3.4s0-2.506,0-2.506c0-.451-.549-.671-.861-.346L.942,6.538c-.247,.258-.247,.665,0,.923l2.308,2.408" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M12.611,5.898l4.447,4.64c.247,.258,.247,.665,0,.923l-4.447,4.64c-.312,.325-.861,.105-.861-.346v-2.506s-5,0-5,0c-.552,0-1-.448-1-1v-2.5c0-.552,.448-1,1-1h5s0-2.506,0-2.506c0-.451,.549-.671,.861-.346Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_arrowsBoldOppositeDirection;