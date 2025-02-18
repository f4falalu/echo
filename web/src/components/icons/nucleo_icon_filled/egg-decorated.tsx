import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_eggDecorated(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px egg decorated";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M6.028,7.702c.265-.163,.603-.146,.85,.043l2.122,1.627,2.122-1.627c.246-.189,.584-.207,.85-.043l3.539,2.181c-.347-5.061-3.081-8.884-6.511-8.884-3.491,0-6.178,3.749-6.513,8.885l3.542-2.183Z" fill={fill}/>
		<path d="M11.625,9.25l-2.169,1.663c-.268,.206-.645,.206-.912,0l-2.169-1.663-3.888,2.396c.368,3.365,3.489,5.353,6.513,5.353s6.144-1.988,6.513-5.353l-3.888-2.396Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default 18px_eggDecorated;