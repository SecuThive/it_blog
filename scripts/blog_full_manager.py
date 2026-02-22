import os
import json
import random
import time
import re
from datetime import datetime
from dotenv import load_dotenv
from google import genai
from supabase import create_client
import requests
from bs4 import BeautifulSoup

# .env 로드
load_dotenv()
if not os.getenv("SUPABASE_URL"):
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
COUPANG_ID = os.getenv("COUPANG_PARTNERS_ID", "AF7493428")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
client = genai.Client(api_key=GEMINI_API_KEY)

def clean_json_text(text):
    """추출된 텍스트에서 JSON 부분만 골라냅니다."""
    text = text.strip()
    match = re.search(r'(\{.*\})', text, re.DOTALL)
    if match:
        return match.group(1)
    return text

def fetch_latest_it_news():
    """네이버 뉴스 IT/과학 섹션에서 최신 뉴스 헤드라인을 가져옵니다."""
    url = "https://news.naver.com/section/105"
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    try:
        response = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.text, 'html.parser')
        headlines = []
        # 네이버 뉴스 구조에 따른 선택자 (수시로 변할 수 있음)
        for item in soup.select('.sa_text_strong, .sh_text_headline'):
            text = item.get_text().strip()
            if text and len(text) > 10:
                headlines.append(text)
        return "\n".join(headlines[:15])
    except Exception as e:
        print(f"[warning] 뉴스 수집 실패: {e}")
        return "최신 AI 반도체 및 빅테크 기업 동향"

def generate_full_auto_post():
    print(f"[system] {datetime.now()} - 팩트 기반 자동 운영 포스팅을 시작합니다...")
    
    news_context = fetch_latest_it_news()
    print(f"[info] 수집된 뉴스 컨텍스트 요약: {news_context[:50]}...")
    
    prompt = f"""
    당신은 대한민국 최고의 IT 전문 기자이자 테크 리뷰어입니다. 
    다음의 **실제 뉴스 데이터**를 바탕으로 팩트에 기반하여 독자들에게 통찰력을 주는 고퀄리티 글을 작성하세요:
    
    {news_context}

    형식은 반드시 다음 키를 가진 JSON 객체 하나여야 합니다:
    - title: 제목
    - description: 요약 (2문장)
    - category: "review" | "smartphone" | "laptop" | "deal"
    - tags: 태그 리스트
    - slug: 영어 슬러그 (소문자와 하이픈)
    - content: 마크다운 형식의 본문 (최소 2500자 이상, 심층 분석)
    - target_product: 제품 리뷰 성격일 경우 제품명 (없으면 빈 문자열)

    규칙:
    1. **절대 허구의 사실을 지어내지 마세요.** 뉴스 데이터가 부족하면 분석적 관점을 더하세요.
    2. 소제목(##)과 볼드체(**)를 적절히 사용하여 가독성을 높이세요.
    3. 본문 중간에 관련 고화질 Unsplash 이미지 URL을 2개 이상 포함하세요.
    4. '~해요', '~네요' 문체를 사용하여 친근하게 작성하세요.
    """

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-flash-latest",
                config={"response_mime_type": "application/json"},
                contents=[prompt]
            )
            
            raw_text = response.text
            cleaned_json = clean_json_text(raw_text)
            data = json.loads(cleaned_json)
            
            # 리스트로 반환될 경우 첫 번째 요소 선택 (안전 장치)
            if isinstance(data, list):
                data = data[0]

            content = data.get('content', "")
            category = data.get('category', "review")
            product = data.get('target_product', "")

            # 쿠팡 파트너스 링크 자동 생성
            if (category in ['review', 'deal', 'smartphone', 'laptop']) and product:
                coupang_link = f"https://link.coupang.com/a/a?page=search&q={product.replace(' ', '+')}&lptag={COUPANG_ID}"
                affiliate_section = f"\n\n---\n\n### 🚀 최저가 확인하기\n현재 **{product}**의 가격과 재고 상황을 아래 링크에서 바로 확인하실 수 있어요!\n\n👉 [{product} 쿠팡 최저가 보러가기]({coupang_link})\n\n> *이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.*"
                content += affiliate_section

            record = {
                "slug": data['slug'] + "-" + str(random.randint(1000, 9999)),
                "title": data['title'],
                "description": data['description'],
                "category": category,
                "tags": data['tags'],
                "author": "IT 전문 에이전트",
                "read_minutes": 10,
                "featured": True,
                "created_at": datetime.now().isoformat()
            }
            
            # 'posts' 테이블에 저장 (필요시 content 필드 추가)
            supabase.table("posts").insert(record).execute()
            print(f"[success] 포스팅 완료: {data['title']}")
            return True
            
        except Exception as e:
            if "429" in str(e):
                print(f"[retry] 할당량 초과. 70초 대기 후 재시도... (시도 {attempt+1}/3)")
                time.sleep(70)
            else:
                print(f"[error] 실패: {e}")
                print(f"[debug] Raw response text: {raw_text[:200] if 'raw_text' in locals() else 'None'}")
                break
    return False

if __name__ == "__main__":
    generate_full_auto_post()
