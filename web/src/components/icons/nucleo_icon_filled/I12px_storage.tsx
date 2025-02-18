import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 12px_storage(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px storage";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<ellipse cx="6" cy="2.75" fill={fill} rx="5" ry="2.75" strokeWidth="0"/>
		<path d="m6,12c-2.851,0-5-1.182-5-2.75,0-.414.336-.75.75-.75s.75.336.75.75c0,.441,1.329,1.25,3.5,1.25s3.5-.809,3.5-1.25c0-.414.336-.75.75-.75s.75.336.75.75c0,1.568-2.149,2.75-5,2.75Z" fill={secondaryfill} strokeWidth="0"/>
		<path d="m6,8.75c-2.851,0-5-1.182-5-2.75,0-.414.336-.75.75-.75s.75.336.75.75c0,.441,1.329,1.25,3.5,1.25s3.5-.809,3.5-1.25c0-.414.336-.75.75-.75s.75.336.75.75c0,1.568-2.149,2.75-5,2.75Z" fill={secondaryfill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default 12px_storage;