import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Post } from '../lib/posts'
import { getCategoryLabel } from '../lib/posts'

type PostCardProps = {
  post: Post
  compact?: boolean
}

export default function PostCard({ post, compact = false }: PostCardProps) {
  const categoryLabel = getCategoryLabel(post.category)

  return (
    <article className={compact ? 'post-card post-card--compact animate-up' : 'post-card animate-up'}>
      <Link href={`/post/${post.slug}`} className={`post-card__cover post-card__cover--${post.category}`}>
        <span>{categoryLabel}</span>
      </Link>
      <div className="post-card__top">
        <span className="chip">{categoryLabel}</span>
        <time dateTime={post.createdAt}>{format(new Date(post.createdAt), 'PPP', { locale: ko })}</time>
      </div>
      <h3 className={compact ? 'post-card__title post-card__title--compact' : 'post-card__title'}>
        <Link href={`/post/${post.slug}`}>{post.title}</Link>
      </h3>
      <p className="post-card__description">{post.description}</p>
      <div className="post-card__meta">
        <span>{post.author}</span>
        <span>{post.readMinutes}분 읽기</span>
      </div>
      <Link href={`/post/${post.slug}`} className="post-card__cta">
        자세히 보기
      </Link>
    </article>
  )
}
