import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function arrowsExpandDiagonal5(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "arrows expand diagonal 5";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M0.868 8.25H17.131V9.75H0.868z" fill={secondaryfill} transform="rotate(-45 9 9)"/>
		<path d="M14.75,10.01c-.414,0-.75-.336-.75-.75V4h-5.26c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6.01c.414,0,.75,.336,.75,.75v6.01c0,.414-.336,.75-.75,.75Z" fill={fill}/>
		<path d="M9.26,15.5H3.25c-.414,0-.75-.336-.75-.75v-6.01c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v5.26h5.26c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default arrowsExpandDiagonal5;