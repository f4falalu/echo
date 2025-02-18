import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_circleLock(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px circle lock";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm.75,9.362v2.138c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.138c-.872-.31-1.5-1.134-1.5-2.112,0-1.243,1.007-2.25,2.25-2.25s2.25,1.007,2.25,2.25c0,.978-.628,1.802-1.5,2.112Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_circleLock;