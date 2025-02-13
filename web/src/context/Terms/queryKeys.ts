export const termsGetList = () => ['terms', 'list'] as const;

export const termsGetTerm = (termId: string) => ['terms', 'get', termId] as const;
