import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function caretMaximizeDiagonal(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px caret maximize diagonal";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m10,1h-4.146c-.406,0-.769.242-.924.617s-.07.803.217,1.09l4.146,4.146c.192.192.446.293.706.293.129,0,.259-.025.384-.077.375-.155.617-.518.617-.924V2c0-.551-.449-1-1-1Z" fill={secondaryfill} strokeWidth="0"/>
		<path d="m2.707,5.146c-.287-.287-.714-.372-1.09-.217-.375.155-.617.518-.617.924v4.146c0,.551.449,1,1,1h4.146c.406,0,.769-.242.924-.617s.07-.803-.217-1.09L2.707,5.146Z" fill={fill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default caretMaximizeDiagonal;