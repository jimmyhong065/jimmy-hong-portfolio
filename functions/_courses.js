// 系列（courses）共用：已發布系列的 id→slug 對照，以及文章的正式網址。
// 章節所屬系列已發布 → /course/<系列>/<章節>；否則（一般文章、系列未發布）→ /blog/<slug>

const SUPABASE_URL = 'https://sfzewfqqxvahnhjxstsw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_3BlJ87PFI0akUX4YcfKIrw_3szffex2'

export async function fetchPublishedCourses(signal) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/courses?select=id,slug,title,description,created_at&published=eq.true&order=display_order`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, signal },
    )
    const rows = await res.json()
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}

export function courseSlugMap(courses) {
  return new Map((courses ?? []).map(c => [c.id, c.slug]))
}

export function postPath(post, slugById) {
  const courseSlug = post.course_id && slugById.get(post.course_id)
  return courseSlug ? `/course/${courseSlug}/${post.slug}` : `/blog/${post.slug}`
}
