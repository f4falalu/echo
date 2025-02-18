import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function balance(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "balance";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1ZM2.5,9c0-2.019,.925-3.825,2.373-5.018-.149,.44-.248,.903-.248,1.393,0,2.413,1.962,4.375,4.375,4.375,1.585,0,2.875,1.29,2.875,2.875s-1.29,2.875-2.875,2.875c-3.584,0-6.5-2.916-6.5-6.5Z" fill={fill}/>
	</g>
</svg>
	);
};

export default balance;