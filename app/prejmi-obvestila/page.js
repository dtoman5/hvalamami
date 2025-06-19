import dynamic from 'next/dynamic';

export const dynamic = 'force-dynamic'; // never prerender
export const runtime = 'edge';          // or 'nodejs' if you prefer

// load the client component only in the browser
const PrejmiObvestilaClient = dynamic(
  () => import('@/app/components/PrejmiObvestilaClient'),
  { ssr: false }
);

export default function PrejmiObvestilaPage() {
  return <PrejmiObvestilaClient />;
}