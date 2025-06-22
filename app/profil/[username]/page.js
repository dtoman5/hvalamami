import { redirect } from 'next/navigation';

export default function ProfilePage({ params }) {
  redirect(`/profil/${params.username}/posts`);
}