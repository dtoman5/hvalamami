import { redirect } from 'next/navigation';

export default function Page() {
  // Komponenta se renderja na serverju, redirect bo takoj preusmeril
  redirect('/zid/followers');
}