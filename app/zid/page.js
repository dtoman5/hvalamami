'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Navbar from '@/components/Navbar'
import HomePosts from '@/components/Posts/HomePosts'
import PostReview from '@/components/Overlays/PostReview'
import { toast } from 'react-toastify'
import { useUploadStore } from '@/store/uploadStore'
import KategorijeOverlay from '../components/Overlays/KategorijeOverlay'
import Link from 'next/link'
import Sidebar from '../components/Sidebar'

export default function Zid() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [isPostReviewOpen, setIsPostReviewOpen] = useState(false)
  const [isCategoryOverlayOpen, setIsCategoryOverlayOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, first_name, profile_picture_url')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Napaka pri pridobivanju profila:', error.message)
    } else {
      setProfile(data)
    }
  }

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Napaka pri nalaganju kategorij:', error)
    } else {
      setCategories(data || [])
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/prijava')
      } else {
        setUser(user)
        await fetchProfile(user.id)
        await fetchCategories()
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  const handleEditPost = (post) => {
    setSelectedPost(post)
    setIsPostReviewOpen(true)
  }

  const handleDeletePost = async (postId) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) {
      console.error('Napaka pri brisanju objave:', error.message)
      toast.error('Napaka pri brisanju objave')
    } else {
      toast.success('Objava uspešno izbrisana')
    }
  }

  if (loading) return <div className="loading">Nalaganje...</div>

  return (
    <>
      <Navbar />
      <PostReview
        isOpen={isPostReviewOpen}
        onClose={() => setIsPostReviewOpen(false)}
        post={selectedPost}
        onSave={() => {}}
        categories={categories}
      />
      <Sidebar />
      <div className="container">
        <div className="container-content">
          <div className="row">
            <div className="dashboard-text p-b-5 m-b-2">
              <div className="text-center">
                <div className="user-post">
                  <img
                    src={profile?.profile_picture_url || '/default-avatar.png'}
                    alt="Avatar"
                    className="avatar"
                    onError={(e) => (e.target.src = '/default-avatar.png')}
                  />
                  <div className="user-post-intro">
                    {profile?.username || 'Uporabnik'}
                  </div>
                </div>
                <h1 className='p-t-2 p-b-3'>
                  {profile ? (
                    <><span>{profile.first_name}</span>, tukaj je tvoj prostor dogajanja.</>
                  ) : (
                    "Nalaganje profila..."
                  )}
                </h1>
                <Link href="/" className='btn-1'><i className="bi bi-info-circle"></i> Navodila</Link>
              </div>
            </div>
            <div className="dashboard-post text-center"
              onClick={() => {
                setSelectedPost(null)
                setIsPostReviewOpen(true)
              }}>
              <div className="dashboard-user-post">
                <div className="post-username">
                  {profile?.username || 'Uporabnik'}
                </div>
              </div>
              <div className='flex-content-post'>
              <span className='post-icon'><i className="bi bi-plus-circle-dotted"></i></span><p>dodaj objavo</p>
              </div>
            </div>
            </div>
            <div className="category-row">
              <div className="flex-content m-b-2">
                <div className="menu-title">Izbrane kategorije</div>
                <div className="category-all text-center">
                  <button className="btn-category-all" onClick={() => setIsCategoryOverlayOpen(true)}>Vse kategorije</button>
                </div>
              </div>
              <div className="flex-content-x">
  {categories
    .slice(0, 15) // lahko dodaš .sort(...) če imaš podatke o številu objav
    .map((category) => (
      <Link
        href={`/kategorija/${encodeURIComponent(category.name)}`}
        key={category.id}
        className="category-item"
        style={{ backgroundColor: category.hex_color }}
      >
        <div className="category-img">
          <img
            className=""
            src={category.cat_img || 'https://www.minime.si/iimg/9122/i.png'}
            alt={category.name}
          />
        </div>
        <div className="category-content">
          {category.name}
        </div>
      </Link>
    ))}
</div>
            </div>
            <div className='container-content-bg p-t-3 p-b-5'>
            <div className='row'>
            <HomePosts 
              onDelete={handleDeletePost}
              onEdit={handleEditPost} 
            />
          </div>
          </div>
        </div>
      </div>
      <KategorijeOverlay isOpen={isCategoryOverlayOpen} onClose={() => setIsCategoryOverlayOpen(false)} />
    </>
  )
}