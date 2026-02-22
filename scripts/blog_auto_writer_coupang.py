import os
import json
import random
import time
import hmac
import hashlib
import requests
from datetime import datetime
from dotenv import load_dotenv
from google import genai
from supabase import create_client
from bs4 import BeautifulSoup

# 환경 변수 로드
load_dotenv()
if not os.getenv("SUPABASE_URL"):
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# 쿠팡 파트너스 설정
COUPANG_ACCESS_KEY = os.getenv("COUPANG_ACCESS_KEY")
COUPANG_SECRET_KEY = os.getenv("COUPANG_SECRET_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
client = genai.Client(api_key=GEMINI_API_KEY)

def get_realtime_it_news(keyword):
    """구글 검색을 통해 실시간 IT 소식, 제품 출시일, 인기/관심도를 크롤링"""
    print(f"[system] '{keyword}' 관련 실시간 시장 반응 및 팩트 체크를 진행 중입니다...")
    search_url = f"https://www.google.com/search?q={keyword}+최신+출시일+성능+리뷰+관심도"
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    
    try:
        response = requests.get(search_url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 검색 결과 텍스트 추출
        body_text = soup.get_text()
        cleaned_text = " ".join(body_text.split())[:3000]
        
        return cleaned_text if len(cleaned_text) > 100 else "2026년 최신 기술 데이터"
    except Exception as e:
        print(f"[warning] 데이터 수집 실패: {e}")
        return "실시간 시장 데이터 수집 중"

def generate_hmac_signature(method, url, secret_key, access_key):
    path, query = url.split('?') if '?' in url else (url, "")
    datetime_str = datetime.utcnow().strftime('%y%m%dT%H%M%SZ')
    message = datetime_str + method + path + (('?' + query) if query else '')
    signature = hmac.new(bytes(secret_key, 'utf-8'), msg=bytes(message, 'utf-8'), digestmod=hashlib.sha256).hexdigest()
    return f"CEA algorithm=HmacSHA256, access-key={access_key}, signed-date={datetime_str}, signature={signature}"

def get_coupang_products(keyword):
    """쿠팡 파트너스 API를 통해 상품 정보 검색"""
    if not COUPANG_ACCESS_KEY or not COUPANG_SECRET_KEY:
        print("[system] 쿠팡 API 키가 설정되지 않아 가상 데이터를 사용합니다.")
        return [
            {"productName": f"{keyword} 최신형", "productPrice": 1200000, "productUrl": "https://link.coupang.com/a/fake1"},
            {"productName": f"{keyword} 가성비 모델", "productPrice": 850000, "productUrl": "https://link.coupang.com/a/fake2"}
        ]
    
    DOMAIN = "https://api-gateway.coupang.com"
    URL = f"/v2/providers/market_place_merchant/api/v1/products/search?keyword={keyword}&limit=3"
    
    authorization = generate_hmac_signature("GET", URL, COUPANG_SECRET_KEY, COUPANG_ACCESS_KEY)
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": authorization
    }
    
    try:
        response = requests.get(DOMAIN + URL, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get("data") and data["data"].get("productData"):
            return data["data"]["productData"]
        else:
            print(f"[warning] 검색 결과가 없습니다. 가상 데이터를 사용합니다. (Keyword: {keyword})")
            return [
                {"productName": f"{keyword} 최신형", "productPrice": 1200000, "productUrl": "https://link.coupang.com/a/fake1"},
                {"productName": f"{keyword} 가성비 모델", "productPrice": 850000, "productUrl": "https://link.coupang.com/a/fake2"}
            ]
    except Exception as e:
        print(f"[error] 쿠팡 API 호출 실패: {e}. 가상 데이터를 사용합니다.")
        return [
            {"productName": f"{keyword} 인기 모델", "productPrice": 1000000, "productUrl": "https://link.coupang.com/a/fake1"}
        ]

def generate_coupang_review():
    print("[system] 고도화된 실시간 팩트체크 기반 포스팅을 시작합니다...")
    
    keywords = ["맥북 에어 M4", "아이폰 17", "갤럭시 S26 울트라", "RTX 5090 Ti", "아이패드 프로 M4 13", "소니 WH-1000XM6"]
    keyword = random.choice(keywords)
    
    # 1. 실시간 트렌드 및 팩트 데이터 수집
    market_data = get_realtime_it_news(keyword)
    
    # 2. 쿠팡 실시간 상품 정보
    products = get_coupang_products(keyword)
    product_context = "\n".join([f"- 상품명: {p['productName']}, 가격: {p['productPrice']}원, 링크: {p['productUrl']}" for p in products])

    # 3. Gemini를 이용한 전문적인 포스팅 생성
    prompt = f"""
    당신은 대한민국 No.1 IT 저널리스트이자 쇼핑 큐레이터 '테크 마스터'입니다. 
    제공된 **실시간 시장 데이터**와 **쿠팡 상품 정보**를 바탕으로 독자에게 압도적인 신뢰를 주는 분석글을 작성하세요.

    [실시간 시장 및 팩트 데이터]
    {market_data}

    [실시간 쿠팡 상품 현황]
    {product_context}

    형식은 반드시 다음 키를 가진 JSON이어야 합니다:
    - title: [심층분석] {keyword}, 지금 사는 게 맞을까? 실시간 관심도 및 가성비 완벽 검증
    - description: "{keyword}의 최신 출시 정보와 실제 사용자 관심도, 그리고 쿠팡 최저가 데이터를 비교한 가이드입니다."
    - category: "deal"
    - tags: ["{keyword}", "2026IT트렌드", "팩트체크", "구매가이드"]
    - slug: "{keyword.replace(' ', '-').lower()}-deep-dive-2026"
    - sections: 다음 4가지 주제를 반드시 포함하는 섹션
        1. 실시간 시장 반응 및 관심도: 현재 이 제품이 왜 핫한지 실시간 데이터를 근거로 설명
        2. 스펙 팩트 체크: 최신 모델(M4, S26 등)이 확실한지, 이전 세대와 무엇이 다른지 기술적으로 분석
        3. 쿠팡 가격 분석 및 추천 모델: 현재 리스팅된 상품들의 가격이 적정한지 제안
        4. 최종 결론 및 구매 타이밍: 지금 당장 사야 할 사람과 기다려야 할 사람을 명확히 구분

    작성 규칙:
    - **가독성 극대화**: 마크다운 표, 불렛 포인트, **굵은 글씨**를 사용하여 모바일에서도 읽기 쉽게 작성하세요.
    - **이미지 배치**: 각 섹션마다 `![이미지 설명](Unsplash_IT_URL)`을 적절히 배치하여 시각적 즐거움을 주세요.
    - **수익 고지**: 마지막에 파트너스 문구를 반드시 포함하세요.
    """

    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            config={"response_mime_type": "application/json"},
            contents=[prompt]
        )
        
        data = json.loads(response.text)
        
        record = {
            "slug": data['slug'] + "-" + str(random.randint(100, 999)),
            "title": data['title'],
            "description": data['description'],
            "category": data['category'],
            "tags": data['tags'],
            "author": "테크 마스터",
            "read_minutes": 8,
            "featured": True,
            "sections": data['sections'],
            "created_at": datetime.now().isoformat()
        }
        
        supabase.table("blog_posts").insert(record).execute()
        print(f"[success] 고도화된 포스팅 완료: {data['title']}")
        
    except Exception as e:
        if "429" in str(e):
            print("[info] Gemini API 할당량 초자. 60초 대기 후 재시도합니다...")
            time.sleep(65)
            return generate_coupang_review()
        print(f"[error] 포스팅 생성 중 오류: {e}")

if __name__ == "__main__":
    generate_coupang_review()
