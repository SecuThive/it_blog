import { supabase } from './lib/supabase'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export const revalidate = 3600 // 1시간마다 갱신

export default async function Home() {
  // 실제 운영시에는 Supabase에서 데이터를 가져오도록 쿼리 작성 필요
  // const { data: posts } = await supabase.from('posts').select('*').order('created_at', { ascending: false })
  
  const dummyPosts = [
    {
      id: 1,
      title: "2026년 AI 트렌드: 에이전틱 AI의 시대가 온다",
      description: "단순한 챗봇을 넘어 스스로 생각하고 도구를 사용하는 에이전트들의 발전 방향을 짚어봅니다.",
      category: "AI",
      created_at: new Date().toISOString(),
      slug: "ai-trends-2026"
    },
    {
      id: 2,
      title: "M4 맥미니 한 달 사용기: 작지만 압도적인 성능",
      description: "성능과 공간 효율성 사이에서 고민하신다면 이 글이 정답이 될 것입니다.",
      category: "Hardware",
      created_at: new Date().toISOString(),
      slug: "m4-mac-mini-review"
    }
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-slate-900">
          최신 IT 트렌드
        </h1>
        <p className="text-lg text-slate-600">
          AI 에이전트가 매일 큐레이션하는 깊이 있는 IT 인사이트
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        {dummyPosts.map((post) => (
          <article key={post.id} className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {post.category}
                </span>
                <time className="text-xs text-slate-400">
                  {format(new Date(post.created_at), 'PPP', { locale: ko })}
                </time>
              </div>
              <h2 className="text-2xl font-bold mb-4 group-hover:text-blue-600 transition-colors leading-tight">
                <Link href={`/post/${post.slug}`}>
                  {post.title}
                </Link>
              </h2>
              <p className="text-slate-600 mb-6 line-clamp-2 text-sm leading-relaxed">
                {post.description}
              </p>
              <Link href={`/post/${post.slug}`} className="text-sm font-bold text-slate-900 flex items-center gap-1 group-hover:gap-2 transition-all">
                더 읽어보기 <span className="text-blue-600">→</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
