import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_shareLeft3(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px share left 3";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9,5.772V2.75c0-.294-.172-.561-.439-.683-.268-.121-.582-.077-.803,.117L1.257,7.851c-.162,.141-.256,.345-.257,.56s.089,.42,.249,.563l6.5,5.833c.221,.198,.537,.247,.807,.127,.27-.121,.444-.389,.444-.685v-2.973c4.296,.318,6.547,3.285,6.645,3.416,.144,.196,.371,.307,.605,.307,.078,0,.157-.012,.233-.037,.308-.101,.517-.389,.517-.713,0-.083-.095-8.006-8-8.478Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_shareLeft3;