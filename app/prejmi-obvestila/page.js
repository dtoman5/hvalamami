// app/prejmi-obvestila/page.js
import dynamic from 'next/dynamic'

export const runtime = 'edge'  // ali 'nodejs', če ti bolj ustreza

// komponenta, ki se naloži samo na klientu
const PrejmiObvestilaClient = dynamic(
  () => import('@/app/components/PrejmiObvestilaClient'),
  { ssr: false }
)

export default function PrejmiObvestilaPage() {
  return <PrejmiObvestilaClient />
}