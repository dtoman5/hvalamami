// app/kategorija/[name]/page.js
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function CategoryIndex({ params }) {
  // params.name is already decoded (e.g. "Malčki"), 
  // but we must re-encode it when building a URL.
  redirect(`/kategorija/${encodeURIComponent(params.name)}/posts`);
}