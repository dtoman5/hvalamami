// app/prejmi-obvestila/page.js
export const runtime = 'edge';

import dynamic from 'next/dynamic';

const PrejmiObvestilaClient = dynamic(
  () => import('../components/PrejmiObvestilaClient'),
  { ssr: false }
);

export default function PrejmiObvestilaPage() {
  return <PrejmiObvestilaClient />;
}