import os
import json
import requests
from datetime import datetime
from dotenv import load_dotenv
from google import genai
from supabase import create_client

load_dotenv()

# 설정
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
client = genai.Client(api_key=GEMINI_API_KEY)

def generate_blog_post():
    print("[system] IT 블로그 포스팅 생성을 시작합니다...")
    
    # 모델 리스트 확인
    try:
        models = client.models.list()
        for m in models:
            print(f"[debug] Available model: {m.name}")
    except Exception as e:
        print(f"[debug] 모델 리스트 확인 실패: {e}")

    prompt = """
    당신은 세계 최고의 IT 저널리스트이자 기술 분석가입니다. 
    오늘의 최신 IT 트렌드(AI, 하드웨어, 소프트웨어, 반도체 등) 중 하나를 선정하여 
    구글 검색 상단에 노출될 수 있는 SEO 최적화된 한국어 블로그 포스팅을 작성하세요.

    형식은 반드시 다음 키를 가진 JSON이어야 합니다:
    - title: 흥미로운 제목
    - content: 마크다운 형식의 본문 (최소 1500자 이상, 상세한 분석 포함)
    - description: 2문장 내외의 요약
    - category: (AI, Hardware, Software, Mobile 중 선택)
    - tags: 관련 태그 3~5개 (리스트 형식)
    - slug: 영어로 된 URL용 슬러그

    규칙:
    1. 독자에게 실질적인 가치를 주는 깊이 있는 정보를 담으세요.
    2. 전문적이면서도 친근한 어조를 사용하세요.
    3. 본문에 적절한 소제목(#, ##)을 활용하세요.
    """

    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            config={"response_mime_type": "application/json"},
            contents=[prompt]
        )
        
        post_data = json.loads(response.text)
        
        # Supabase 'blog_posts' 테이블에 저장 (테이블이 생성되어 있어야 함)
        # record = {
        #     "title": post_data['title'],
        #     "content": post_data['content'],
        #     "description": post_data['description'],
        #     "category": post_data['category'],
        #     "tags": post_data['tags'],
        #     "slug": post_data['slug'],
        #     "status": "published",
        #     "created_at": datetime.utcnow().isoformat()
        # }
        # supabase.table("blog_posts").insert(record).execute()
        
        print(f"[success] 포스팅 생성 완료: {post_data['title']}")
        return post_data

    except Exception as e:
        print(f"[error] 포스팅 생성 중 오류: {e}")
        return None

if __name__ == "__main__":
    generate_blog_post()
