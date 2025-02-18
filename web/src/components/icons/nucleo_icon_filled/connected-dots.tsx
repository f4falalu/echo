import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_connectedDots(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px connected dots";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M12.618,11.618l-2.868-2.235v-3.133c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v3.133l-2.868,2.235c-.327,.255-.385,.726-.131,1.053,.148,.19,.369,.289,.592,.289,.161,0,.324-.052,.46-.158l2.696-2.101,2.696,2.101c.137,.106,.299,.158,.46,.158,.223,0,.444-.099,.592-.289,.254-.327,.196-.798-.131-1.053Z" fill={secondaryfill}/>
		<circle cx="9" cy="4" fill={fill} r="3"/>
		<circle cx="14" cy="13.5" fill={fill} r="3"/>
		<circle cx="4" cy="13.5" fill={fill} r="3"/>
	</g>
</svg>
	);
};

export default 18px_connectedDots;