import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_viewMinusSign(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px view minus sign";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m9.5,14.25c0-1.2407,1.0093-2.25,2.25-2.25h3.1688c.7028-.6787,1.2426-1.3828,1.6198-1.9546.6182-.9395.6182-2.1514,0-3.0898-1.0962-1.6641-3.5332-4.4561-7.5386-4.4561-4.001,0-6.4404,2.791-7.5386,4.4551-.6182.9395-.6182,2.1514,0,3.0898,1.0962,1.6641,3.5332,4.4561,7.5386,4.4561.1787,0,.3505-.012.523-.0227-.0078-.0759-.023-.1497-.023-.2278Zm-3.5-5.7495c0-1.6543,1.3457-3,3-3s3,1.3457,3,3-1.3457,3-3,3-3-1.3457-3-3Z" fill={fill} strokeWidth="0"/>
		<path d="m16.75,13.5h-5c-.414,0-.75.336-.75.75s.336.75.75.75h5c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z" fill={secondaryfill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default 18px_viewMinusSign;