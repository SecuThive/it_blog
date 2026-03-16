import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ThiveLab',
    short_name: 'ThiveLab',
    description: 'AI가 큐레이션하는 IT 인사이트 — 한국 소비자 관점의 기기 소식/업데이트 정리',
    start_url: '/',
    display: 'browser',
    background_color: '#0b1020',
    theme_color: '#0b1020',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
