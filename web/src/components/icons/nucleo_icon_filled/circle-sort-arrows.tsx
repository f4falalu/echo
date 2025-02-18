import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_circleSortArrows(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px circle sort arrows";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm2.151,9.991l-1.695,1.978c-.24,.28-.672,.28-.911,0l-1.695-1.978c-.334-.389-.057-.991,.456-.991h3.39c.513,0,.789,.602,.456,.991Zm-.456-2.991h-3.39c-.513,0-.789-.602-.456-.991l1.695-1.978c.24-.28,.672-.28,.911,0l1.695,1.978c.334,.389,.057,.991-.456,.991Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_circleSortArrows;