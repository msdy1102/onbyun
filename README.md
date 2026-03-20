# 온변 — 온라인 변호사

계약서 주의사항 + 신청 서류 + 전체 문서 목록을 무료로 제공하는 서비스.

## 로컬 실행

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Vercel 배포 (5분)

1. GitHub에 올리기
```bash
git init && git add . && git commit -m "init: 온변 v1.0"
git remote add origin https://github.com/YOUR_ID/onbyun.git
git push -u origin main
```

2. [vercel.com](https://vercel.com) → New Project → GitHub 레포 → Deploy
3. **환경변수 없음** — 바로 배포 완료!

## 도메인 연결
- Vercel 대시보드 → Project → Settings → Domains
- `onbyun.com` 또는 원하는 도메인 입력 후 DNS 설정

## 수익화 로드맵

### 1단계 — 정보형 (지금)
- Google AdSense 신청 (사이트 배포 후 신청)
- 콘텐츠 SEO 최적화

### 2단계 — AI 기능 추가 (트래픽 생기면)
- Anthropic API 연동 → 계약서 업로드 분석
- 무료 3회 → 월 5,900원 구독

### 3단계 — 제휴 수익
- 법무사·변호사 연결 수수료
- 법률 서비스 제휴

## 타겟 SEO 키워드
- 근로계약서 확인사항
- 임대차계약서 주의사항
- 전세사기 체크리스트
- 프리랜서 계약서 주의사항
- 청년월세지원 신청서류
- 버팀목전세대출 필요서류
- 실업급여 신청방법

## 기술 스택
- Next.js 14 (App Router)
- React 18
- CSS Modules
- Vercel (무료 배포)
