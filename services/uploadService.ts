import { createClient } from '@/lib/supabase/client'

export const uploadFile = async (
  file: File,
  bucketName: string,
  folderPath: string = ''
): Promise<string> => {
  const supabase = createClient()
  
  // Format filename to avoid spaces and special characters
  const fileExtension = file.name.split('.').pop()
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`
  
  // Construct full path
  const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fullPath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw error
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fullPath)

  return publicUrlData.publicUrl
}
