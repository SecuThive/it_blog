import os
import time
import random
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv

load_dotenv()

# Configuration
FASTCUT_URL = "https://fastcut.fastseller.shop/create/product"
# OpenClaw Relay uses token authentication.
# Playwright connect_over_cdp usually takes a ws:// URL.
# We append the token as a query param if the relay supports it, 
# or ensure the local relay is reachable without headers for loopback (if configured).
OPENCLAW_RELAY_WS = "ws://127.0.0.1:18792/cdp" 
GATEWAY_TOKEN = "abe04b8cce80a22a90a07d1dfc3d77696ea2a1c6e7b47745"

def run_fastcut_automation():
    keyword = random.choice(["아이패드 프로 M4", "맥북 에어 M3", "갤럭시 S24 울트라"])
    # (Coupang URL sourcing logic)
    
    with sync_playwright() as p:
        # connect_over_cdp supports 'headers' parameter in recent versions
        try:
            browser = p.chromium.connect_over_cdp(
                OPENCLAW_RELAY_WS, 
                headers={"x-openclaw-relay-token": GATEWAY_TOKEN}
            )
        except Exception as e:
            print(f"[error] 연결 실패: {e}")
            return

        # 현재 연결된 탭을 찾음
        context = browser.contexts[0]
        # 패스트컷 페이지를 찾거나 새로 엶
        page = None
        for p_obj in context.pages:
            if "fastseller.shop" in p_obj.url:
                page = p_obj
                break
        
        if not page:
            page = context.new_page()
            page.goto(FASTCUT_URL)
        
        print(f"[auto] 패스트컷 자동화 시작 (키워드: {keyword})")
        
        try:
            # 1. 상품 영상 페이지로 이동
            print(f"[auto] 현재 URL: {page.url}")
            if "create/product" not in page.url:
                print("[auto] '상품 영상' 메뉴 클릭 시도...")
                # 헤더의 '상품 영상' 버튼 클릭
                page.locator("button:has-text('상품 영상')").first.click()
                page.wait_for_url("**/create/product", timeout=10000)
            
            # 2. 'AI에게 모두 맡기기' 선택
            print("[auto] '🤖 AI에게 모두 맡기기' 섹션 찾는 중...")
            ai_mode_btn = page.locator("div").filter(has_text="🤖 AI에게 모두 맡기기").last
            ai_mode_btn.scroll_into_view_if_needed()
            ai_mode_btn.click()
            print("[auto] 'AI에게 모두 맡기기' 모드 활성화")
            time.sleep(1)

            # 3. 상품 선택 (확장 프로그램에서 수집한 상품 선택)
            print("[auto] '확장 프로그램에서 수집한 상품 선택하기' 버튼 클릭...")
            page.locator("button:has-text('확장 프로그램에서 수집한 상품 선택하기')").click()
            time.sleep(3)
            
            # 4. 첫 번째 상품 선택 (팝업 내 '선택' 버튼)
            try:
                # 팝업 내의 첫 번째 '선택' 버튼 클릭
                select_btn = page.locator("button:has-text('선택')").first
                if select_btn.is_visible():
                    select_btn.click()
                    print("[auto] 상품 리스트에서 첫 번째 항목 선택 완료")
                else:
                    print("[warning] 상품 선택 버튼이 보이지 않습니다.")
            except Exception as e:
                print(f"[warning] 상품 선택 중 오류: {e}")

            # 5. 생성 요청
            print("[auto] 최종 생성 요청 버튼 확인 중...")
            request_btn = page.locator("button").filter(has_text="영상 생성 요청")
            request_btn.scroll_into_view_if_needed()
            
            if request_btn.is_enabled():
                # request_btn.click() # 실제 생성 시 주석 해제
                print("[success] 영상 생성 요청 버튼 확인 완료 (활성화 상태)")
            else:
                print("[info] 영상 생성 요청 버튼이 아직 비활성화 상태입니다. (상품 데이터 로딩 중일 수 있음)")

        except Exception as e:
            print(f"[error] 자동화 과정 중 오류 발생: {e}")
            # 스크린샷 찍어 저장
            page.screenshot(path="/Users/thiveserver/.openclaw/workspace/fastcut_error.png")
        
        finally:
            browser.close()

if __name__ == "__main__":
    run_fastcut_automation()
