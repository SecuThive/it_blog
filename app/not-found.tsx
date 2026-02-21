import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container not-found-page">
      <p>404</p>
      <h1>요청하신 페이지를 찾을 수 없습니다.</h1>
      <Link href="/">홈으로 이동</Link>
    </div>
  )
}
