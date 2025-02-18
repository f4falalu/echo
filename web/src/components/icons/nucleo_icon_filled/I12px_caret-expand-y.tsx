import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function caretExpandY(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px caret expand y";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m8.249,7H3.751c-.382,0-.725.212-.895.554-.17.342-.133.743.096,1.048l2.249,2.984c.188.25.487.398.799.398s.611-.149.799-.398l2.249-2.984c.229-.305.267-.707.096-1.048-.17-.341-.513-.554-.895-.554Z" fill={secondaryfill} strokeWidth="0"/>
		<path d="m6.799.414c-.376-.499-1.222-.499-1.598,0l-2.249,2.984c-.229.305-.267.707-.096,1.048.17.341.513.554.895.554h4.497c.382,0,.725-.212.895-.554.17-.342.133-.743-.096-1.048L6.799.414Z" fill={fill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default caretExpandY;