import { execSync } from 'child_process'
import { readFileSync, mkdirSync, readdirSync } from 'fs'
import { join, basename } from 'path'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://sfzewfqqxvahnhjxstsw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_3BlJ87PFI0akUX4YcfKIrw_3szffex2'
const UPLOAD_URL = 'https://jimmy-hong-portfolio.pages.dev/upload'
const UPLOAD_SECRET = 'f714673a-860c-4231-97a4-3b09152c605a'
const PICTURES_DIR = '/Users/jimmyhong/Desktop/qa_self_blog/docs/pictures'
const COMPRESSED_DIR = '/tmp/qa_photo_upload'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
await supabase.auth.signInWithPassword({ email: 'rbingwork1030@gmail.com', password: '@Pwd0917365' })
console.log('✅ Supabase 登入成功\n')

const albums = [
  {
    dir: '時尚寫真',
    title: '性感婚紗寫真',
    tags: ['時尚', '婚紗', '寫真'],
    display_order: 4,
    story: `婚紗不只是儀式的衣裳，更是一種姿態的展現。

這組作品以純白婚紗為媒介，探索女性在柔美與性感之間的平衡。每一個眼神、每一個姿勢，都是攝影師與被攝者之間無聲的對話。

光線從側面灑落，在布料的層次間製造出流動的光影，讓每一張照片都有呼吸感。我們刻意選擇低飽和的後製風格，讓婚紗的質地和模特兒的輪廓成為畫面的主角。`,
  },
  {
    dir: '閨蜜寫真',
    title: '閨蜜寫真',
    tags: ['閨蜜', '人像', '寫真'],
    display_order: 5,
    story: `有些笑容，只有在閨蜜面前才會出現。

閨蜜寫真捕捉的不只是外表，而是兩個人之間那種不需要解釋的默契。眼神交會的瞬間、一起大笑的片刻、靠在彼此肩膀的溫度——這些都是用鏡頭說不完的友情故事。

拍攝前我們刻意不做太多規劃，讓兩個人自然互動，攝影師退到一步之遙，記錄最真實的她們。畫面裡的每一格，都是未來某一天回頭看時，會心頭一暖的記憶。`,
  },
  {
    dir: '糖果女孩寫真',
    title: '糖果女孩寫真',
    tags: ['糖果色', '甜美', '寫真'],
    display_order: 6,
    story: `如果人生可以有一個甜甜的下午，它大概長這個樣子。

糖果女孩系列以馬卡龍色系為主調，從服裝到背景都選用粉嫩、夢幻的色彩搭配，打造出一個屬於自己的童話場景。不是只有公主才能穿粉紅，任何人都可以在這裡做自己故事的主角。

後製時保留了膚色的溫度感，讓甜美不流於虛假，讓夢幻多了一點真實。`,
  },
]

mkdirSync(COMPRESSED_DIR, { recursive: true })

async function uploadFile(filePath) {
  const filename = `${Date.now()}-${basename(filePath)}`
  const compressedPath = join(COMPRESSED_DIR, filename)

  execSync(`sips -Z 1920 -s formatOptions 80 "${filePath}" --out "${compressedPath}"`, { stdio: 'pipe' })

  const fileBuffer = readFileSync(compressedPath)
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' })
  const fd = new FormData()
  fd.append('file', blob, filename)

  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UPLOAD_SECRET}` },
    body: fd,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Upload failed: ${res.status} ${err}`)
  }

  const { url } = await res.json()
  return url
}

for (const album of albums) {
  console.log(`\n📁 處理相簿：${album.title}`)
  const albumDir = join(PICTURES_DIR, album.dir)
  const files = readdirSync(albumDir)
    .filter(f => f.match(/\.(jpg|jpeg|png)$/i))
    .sort()
    .filter((f, i, arr) => !arr.some((g, j) => j < i && g.replace(/\(1\)/, '') === f))

  const urls = []
  for (const file of files) {
    const filePath = join(albumDir, file)
    process.stdout.write(`  上傳 ${file}... `)
    try {
      const url = await uploadFile(filePath)
      urls.push(url)
      console.log('✅')
    } catch (e) {
      console.log(`❌ ${e.message}`)
    }
  }

  if (urls.length === 0) {
    console.log('  ⚠️  沒有成功上傳，跳過建立作品')
    continue
  }

  const payload = {
    title: album.title,
    description: album.story.split('\n\n')[0],
    content: album.story,
    cover_url: urls[0],
    images: urls,
    tags: album.tags,
    display_order: album.display_order,
  }

  const existing = await supabase.from('photo_projects').select('id').eq('title', album.title).single()
  if (existing.data) {
    await supabase.from('photo_projects').update(payload).eq('id', existing.data.id)
    console.log(`  ✅ 更新作品「${album.title}」（${urls.length} 張）`)
  } else {
    await supabase.from('photo_projects').insert(payload)
    console.log(`  ✅ 新增作品「${album.title}」（${urls.length} 張）`)
  }
}

console.log('\n🎉 完成！')
