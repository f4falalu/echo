import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 12px_caretMinimizeDiagonal(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px caret minimize diagonal";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m7.707.396c-.287-.287-.714-.373-1.09-.217-.375.155-.617.518-.617.924v3.896c0,.551.449,1,1,1h3.896c.406,0,.769-.242.924-.617s.07-.803-.217-1.09L7.707.396Z" fill={secondaryfill} strokeWidth="0"/>
		<path d="m5,6H1.104c-.406,0-.769.242-.924.617s-.07.803.217,1.09l3.896,3.896c.192.192.446.293.706.293.129,0,.259-.025.384-.077.375-.155.617-.518.617-.924v-3.896c0-.551-.449-1-1-1Z" fill={fill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default 12px_caretMinimizeDiagonal;