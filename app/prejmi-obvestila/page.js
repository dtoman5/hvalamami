// app/prejmi-obvestila/page.js
export const runtime = 'edge'; // ali 'nodejs', če želiš

import PrejmiObvestilaClient from '@/components/PrejmiObvestilaClient';

export default function PrejmiObvestilaPage() {
  return <PrejmiObvestilaClient />;
}