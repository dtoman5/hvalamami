// lib/uploadToSupabaseStorage.js

const supabase = createClientComponentClient()

export async function uploadToSupabaseStorage(file, path) {
  if (!file || !path) throw new Error('Missing file or path for upload.')

  const { error } = await supabase.storage
    .from('posts-media')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) throw error

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/posts-media/${path}`
  return publicUrl
}