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
    headers = {"Content-Type": "application/json", "Authorization": authorization}
    
    try:
        response = requests.get(DOMAIN + URL, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data.get("data") and data["data"].get("productData"):
            return data["data"]["productData"]
        else:
            return [
                {"productName": f"{keyword} 최신형", "productPrice": 1200000, "productUrl": "https://link.coupang.com/a/fake1"},
                {"productName": f"{keyword} 가성비 모델", "productPrice": 850000, "productUrl": "https://link.coupang.com/a/fake2"}
            ]
    except Exception as e:
        print(f"[error] 쿠팡 API 호출 실패: {e}")
        return [{"productName": f"{keyword} 인기 모델", "productPrice": 1000000, "productUrl": "https://link.coupang.com/a/fake1"}]

def generate_coupang_review():
    print("[system] 3,500자 롱폼(Long-form) 휴먼 스타일 포스팅을 시작합니다...")
    
    keywords = ["맥북 에어 M4", "아이폰 17", "갤럭시 S26 울트라", "RTX 5090 Ti", "아이패드 프로 M4 13", "소니 WH-1000XM6"]
    keyword = random.choice(keywords)
    
    # 1. 실시간 트렌드 및 팩트 데이터 수집
    market_data = get_realtime_it_news(keyword)
    
    # 2. 쿠팡 실시간 상품 정보
    products = get_coupang_products(keyword)
    product_context = "\n".join([f"- 상품명: {p['productName']}, 가격: {p['productPrice']}원, 링크: {p['productUrl']}" for p in products])

    # 3. Gemini를 이용한 전문적인 포스팅 생성 (3,500자 타겟)
    prompt = f"""
    당신은 대한민국에서 가장 사랑받는 IT 칼럼니스트이자, 옆집 형/오빠처럼 친절하게 테크를 설명해주는 '테크 마스터'입니다. 
    제공된 **실시간 데이터**를 바탕으로, AI가 쓴 딱딱한 글이 아닌 **사람 냄새가 물씬 풍기는 3,500자 이상의 초정밀 분석글**을 작성하세요.

    [실시간 시장 및 팩트 데이터]
    {market_data}

    [실시간 쿠팡 상품 현황]
    {product_context}

    형식은 반드시 다음 키를 가진 JSON이어야 합니다:
    - title: "[끝판왕 리뷰] {keyword}, 제가 직접 분석해봤습니다. 지금 사면 이득일까? (3,500자 심층분석)"
    - description: "{keyword}에 대해 궁금했던 모든 것, 스펙부터 실시간 민심, 그리고 최저가 정보까지 사람의 시선으로 꼼꼼하게 담았습니다."
    - category: "deal"
    - tags: ["{keyword}", "내돈내산느낌", "IT심층분석", "구매가이드", "2026테크"]
    - slug: "{keyword.replace(' ', '-').lower()}-human-review-2026"
    - sections: 최소 6~7개의 섹션 (각 섹션은 매우 길고 풍부하게 작성)

    집필 규칙 (필독):
    1. **사람 냄새 나는 문체**: "안녕하세요! 오늘은 제가 정말 기다렸던...", "~인 것 같아요", "사실 저도 고민되네요"와 같은 친근하고 감성적인 어조를 사용하세요. 
    2. **글자 수 극대화**: 각 섹션마다 최소 500자 이상의 상세한 설명을 덧붙이세요. 단순히 정보를 나열하지 말고, 그 정보가 우리의 삶을 어떻게 바꿀지 '스토리텔링'하세요.
    3. **기술 용어 과외**: '탠덤 OLED', 'NPU' 같은 어려운 용어가 나오면 "이게 뭐냐면요~"라며 초등학생도 이해할 수 있게 비유를 들어 아주 자세히 설명해 주세요.
    4. **독자 소통**: 글 중간중간 독자에게 질문을 던지거나 공감을 유도하는 문장을 넣으세요.
    5. **가독성**: 긴 글인 만큼 마크다운 표, 리스트, **굵은 글씨**, 그리고 섹션별 Unsplash 이미지를 적절히 배치하여 지루하지 않게 하세요.
    6. **수익 고지**: 마지막에 파트너스 안내 문구를 자연스럽게 포함하세요.

    [섹션 구성 예시]:
    1. 도입부: 해당 제품에 대한 기대감과 나의 생각
    2. 실시간 민심 체크: 지금 커뮤니티에서 난리 난 이유
    3. 기술 팩트 체크: M4, S26 등 최신 기술이 가져올 놀라운 변화 (아주 상세히)
    4. 실제 사용 시나리오: 일상에서 이 제품이 필요한 순간들
    5. 쿠팡 가격 및 가성비 분석: 지금 이 가격이 왜 꿀매물인지
    6. 다른 대안과의 비교: "이거 살 바엔 저거?" 고민 해결
    7. 최종 결론: 테크 마스터의 진심 어린 한마디
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
            "read_minutes": 15,
            "featured": True,
            "sections": data['sections'],
            "created_at": datetime.now().isoformat()
        }
        
        supabase.table("blog_posts").insert(record).execute()
        print(f"[success] 3500자 롱폼 포스팅 완료: {data['title']}")
        
    except Exception as e:
        if "429" in str(e):
            print("[info] Gemini API 할당량 초과. 60초 대기 후 재시도합니다...")
            time.sleep(65)
            return generate_coupang_review()
        print(f"[error] 포스팅 생성 중 오류: {e}")

if __name__ == "__main__":
    generate_coupang_review()
