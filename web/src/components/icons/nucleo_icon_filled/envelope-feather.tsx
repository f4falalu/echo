import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function envelopeFeather(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "envelope feather";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M14.25,2.5H3.75c-1.517,0-2.75,1.233-2.75,2.75v7.5c0,1.517,1.233,2.75,2.75,2.75h5.062c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.689,0-1.25-.561-1.25-1.25V7.021l5.654,3.119c.265,.146,.555,.22,.846,.22s.581-.073,.845-.219l5.655-3.12v1.349c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.12c0-1.517-1.233-2.75-2.75-2.75Z" fill={fill}/>
		<path d="M17.916,10.405c-.14-.27-.417-.428-.731-.402-6.354,.556-7.172,7.096-7.18,7.162-.047,.412,.249,.783,.66,.83,.029,.003,.058,.005,.086,.005,.376,0,.7-.282,.744-.665,.004-.039,.029-.231,.093-.524,.087-.422,.26-1.017,.605-1.724,.12-.248,.421-.351,.668-.231,.248,.121,.352,.42,.23,.668-.18,.37-.3,.695-.387,.976h.797c3.05,0,3.419-1.985,3.688-3.435,.133-.713,.258-1.386,.634-1.831,.196-.232,.233-.56,.094-.83Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default envelopeFeather;