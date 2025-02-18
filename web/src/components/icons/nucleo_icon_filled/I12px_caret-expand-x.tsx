import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 12px_caretExpandX(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px caret expand x";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m4.447,2.857c-.341-.17-.743-.133-1.049.096L.414,5.201c-.25.188-.398.487-.398.799s.148.611.398.799l2.985,2.249c.178.133.388.202.6.202.152,0,.306-.035.448-.106.341-.17.553-.513.553-.895V3.751c0-.381-.212-.724-.553-.895Z" fill={fill} strokeWidth="0"/>
		<path d="m11.586,5.201l-2.985-2.249c-.307-.229-.708-.267-1.048-.095-.341.17-.553.513-.553.895v4.497c0,.381.212.724.553.895.143.071.296.106.448.106.212,0,.423-.068.601-.202l2.984-2.249c.25-.188.398-.487.398-.799s-.148-.611-.398-.799Z" fill={secondaryfill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default 12px_caretExpandX;