import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function faceGrinUpsideDown(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "face grin upside down";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm-3,10c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm.686-3.568h0c-.217,.032-.428-.036-.583-.189-.153-.153-.225-.373-.192-.589,.229-1.513,1.557-2.654,3.089-2.654s2.859,1.14,3.089,2.651c.034,.221-.039,.444-.193,.598-.151,.15-.358,.217-.572,.185-1.526-.24-3.106-.24-4.638-.001Zm5.314,3.568c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z" fill={fill}/>
	</g>
</svg>
	);
};

export default faceGrinUpsideDown;