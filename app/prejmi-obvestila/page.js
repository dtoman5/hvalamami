// app/prejmi-obvestila/page.js
import dynamic from 'next/dynamic'

// 1) tell Next not to statically render this route at build time
export const dynamic = 'force-dynamic'

// 2) only load the browser‐only component on the client
const PrejmiObvestilaClient = dynamic(
  () => import('@/app/components/PrejmiObvestilaClient'),
  { ssr: false }
)

export default function PrejmiObvestilaPage() {
  return <PrejmiObvestilaClient />;
}