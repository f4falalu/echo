'use client';

import { useParams } from 'next/navigation';

export default function Page() {
  const params = useParams();
  console.log(params);
  return <>why? just why?</>; //we need this page to be able to load the chat page
}
