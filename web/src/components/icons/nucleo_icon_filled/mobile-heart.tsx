import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function mobileHeart(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "mobile heart";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M12.25,1H5.75c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,1.517,1.233,2.75,2.75,2.75h6.5c1.517,0,2.75-1.233,2.75-2.75V3.75c0-1.517-1.233-2.75-2.75-2.75Zm-3.048,10.449c-.127,.068-.276,.068-.403,0-.673-.358-2.798-1.655-2.798-3.763-.003-.926,.73-1.68,1.64-1.686,.547,.007,1.056,.288,1.36,.751,.304-.463,.813-.744,1.36-.751,.91,.006,1.643,.76,1.64,1.686,0,2.109-2.125,3.406-2.798,3.763Z" fill={fill}/>
	</g>
</svg>
	);
};

export default mobileHeart;