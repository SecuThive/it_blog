import os
import json
import random
import time
from datetime import datetime
from dotenv import load_dotenv
from google import genai
from supabase import create_client

# .env 로드
load_dotenv()
if not os.getenv("SUPABASE_URL"):
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY]):
    print("[error] 환경 변수 누락")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
client = genai.Client(api_key=GEMINI_API_KEY)

def generate_fact_based_pro_review():
    print("[system] 실시간 뉴스 기반 전문 분석 포스팅 작성을 시작합니다...")
    
    # 실제 뉴스 컨텍스트
    news_context = """
    주요 뉴스 팩트:
    1. 삼성전자: 세계 최초 6세대 고대역폭 메모리(HBM4) 양산 및 출하 개시. 
    2. 엔비디아 전략 변화: OpenAI 투자금을 300억 달러로 축소 검토, 하드웨어 공급망 내실화 집중.
    3. 한미 기술 협력: 한미 기술번영 워킹그룹 출범 및 트럼프 정부 AI 협력 강화 논의.
    4. AI 고용 시장: AI 기술 자체보다 매크로 경제 지표(금리 등)가 실업에 더 큰 영향을 준다는 분석.
    """
    
    prompt = f"""
    당신은 대한민국 최고의 IT 기술 분석가입니다. 다음 팩트를 바탕으로 '심층 분석 리뷰'를 작성하세요:
    {news_context}

    형식은 반드시 다음 키를 가진 JSON이어야 합니다:
    - title: 제목
    - description: 요약 (2문장)
    - category: "review"
    - tags: 태그 리스트
    - slug: 영어 슬러그
    - content: 마크다운 형식의 본문 (최소 2000자 이상, 섹션별로 ## 소제목 사용)

    규칙:
    1. '~해요', '~네요' 문체를 섞어 사람이 직접 쓴 듯한 느낌을 주되, 전문 지식을 깊게 다루세요.
    2. 본문 중간에 `![설명](이미지URL)`을 넣으세요.
    3. 삼성 HBM4 양산이 가진 시장 파괴력을 강조하세요.
    """

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-flash-latest",
                config={"response_mime_type": "application/json"},
                contents=[prompt]
            )
            
            data = json.loads(response.text)
            now = datetime.now().isoformat()
            
            record = {
                "slug": data['slug'] + "-" + str(random.randint(100, 999)),
                "title": data['title'],
                "description": data['description'],
                "category": data['category'],
                "tags": data['tags'],
                "author": "테크 전문 에이전트",
                "read_minutes": 10,
                "featured": True,
                "created_at": now
            }
            
            # 'posts' 테이블에 저장
            res = supabase.table("posts").insert(record).execute()
            print(f"[success] 실시간 데이터 기반 전문 리뷰 등록 완료: {data['title']}")
            return data
            
        except Exception as e:
            if "429" in str(e):
                print(f"[retry] 할당량 초과. 60초 대기 후 다시 시도합니다... (시도 {attempt+1}/3)")
                time.sleep(60)
            else:
                print(f"[error] 생성 실패: {e}")
                break
    return None

if __name__ == "__main__":
    generate_fact_based_pro_review()
