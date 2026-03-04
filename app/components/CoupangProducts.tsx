'use client'

import { useEffect, useState } from 'react'

type Product = {
  id: string
  name: string
  price: number
  image: string
  url: string
  isRocket: boolean
}

export default function CoupangProducts({ keyword }: { keyword: string }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/coupang-search?keyword=${encodeURIComponent(keyword)}&limit=4`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [keyword])

  if (loading) {
    return (
      <div className="coupang-skeleton">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="coupang-skeleton__card" />
        ))}
      </div>
    )
  }

  if (!products.length) {
    const searchUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}&channel=user`
    return (
      <div className="coupang-fallback">
        <p className="coupang-fallback__desc">관련 상품을 쿠팡에서 직접 검색해 보세요.</p>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="coupang-fallback__btn"
        >
          쿠팡에서 &quot;{keyword}&quot; 검색하기 →
        </a>
        <p className="coupang-products__notice">
          이 링크는 쿠팡 파트너스 제휴 링크로, 구매 시 일정 수수료가 발생할 수 있습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="coupang-products">
      <div className="coupang-products__grid">
        {products.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="coupang-card"
          >
            {p.isRocket && (
              <span className="coupang-card__rocket">로켓배송</span>
            )}
            {p.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.image}
                alt={p.name}
                className="coupang-card__img"
                loading="lazy"
              />
            )}
            <div className="coupang-card__body">
              <p className="coupang-card__name">{p.name}</p>
              <p className="coupang-card__price">
                {p.price.toLocaleString('ko-KR')}원
              </p>
              <span className="coupang-card__btn">쿠팡에서 보기 →</span>
            </div>
          </a>
        ))}
      </div>
      <p className="coupang-products__notice">
        이 섹션의 링크는 쿠팡 파트너스 제휴 링크로, 구매 시 일정 수수료가 발생할 수 있습니다.
      </p>
    </div>
  )
}
