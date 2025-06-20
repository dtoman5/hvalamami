// app/izbrisi-profil/page.js
'use client'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'

export default function IzbrisiProfilPage() {
  const router = useRouter()

  const handleDelete = async () => {
    if (
      !confirm(
        'Ali res želite izbrisati profil? Ta akcija je nepovratna in izbriše vse vaše objave in zgodbe.'
      )
    ) {
      return
    }

    try {
      const res = await fetch('/api/delete-account', { method: 'POST' })
      if (!res.ok) {
        // try JSON, else text
        let msg = res.statusText
        try {
          const json = await res.json()
          msg = json.error || msg
        } catch {
          msg = await res.text()
        }
        throw new Error(msg)
      }
      // on success, redirect to login
      router.push('/prijava')
    } catch (err) {
      alert(`Napaka pri izbrisu profila: ${err.message}`)
    }
  }

  return (
    <>
      <Navbar />
      <div className="center-position">
        <div className="right-side-content">
          <div className="right-side-text text-center">
            <h1 className="m-b-2">Nas res želiš zapustiti za vedno? 😔</h1>
            <p>
              S klikom na gumb izbriši bodo izgubljene vse objave, zgodbe in
              spomini, ki si jih preživela?
            </p>
            <div className="form-group m-t-2">
              <button className="google-btn" onClick={handleDelete}>
                Izbriši profil
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}