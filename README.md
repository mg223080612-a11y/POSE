# MOMENT

컷마다 아직 쓰지 않은 포즈를 보여 주고, 4컷을 4×6 한 장으로 합성해 포토 프린터로 바로 인화하는 휴대폰 웹 포토부스.

배포 주소: https://pose.gvcs.kr

## 로컬에서 실행

```bash
node tools/serve.mjs
```

브라우저에서 http://localhost:5173 을 연다. (`localhost`는 HTTPS가 아니어도 카메라가 켜진다. 휴대폰에서 쓸 때는 HTTPS 주소 https://pose.gvcs.kr 로 연다.)

## 파일

| 파일 | 하는 일 |
|---|---|
| `index.html`, `css/style.css` | 화면 4개(시작·촬영·결과·인쇄 중)와 운영 설정 |
| `js/app.js` | 화면 전환, 인원 선택, 세션 진행, 화면 꺼짐 방지(F7) |
| `js/picker.js` | 인원별 포즈 뽑기, 세션 안 중복 0(F1·F2), 최근 2세션 후순위(F9) |
| `js/camera.js` | 전면 카메라, 카운트다운, 촬영(F3) |
| `js/compose.js` | 4컷을 1200×1800 한 장(스트립 2줄)으로 합성(F4) |
| `js/print.js` | `window.print()` + `@page 100mm×148mm` 인쇄(F5) |
| `data/poses.json` | 포즈 24개(2인 10·3인 8·4인 이상 6) |
| `img/poses/*.svg` | 포즈 실루엣 (`node tools/make-poses.mjs`로 다시 생성) |

## 검사

```bash
node tools/test-picker.mjs
```

F1(인원별 100회)과 F2(1,000세션 중복 0)를 검사한다.

## 운영 설정

시작 화면 오른쪽 위 톱니바퀴: 포즈 가이드 켬/끔(비교 테스트용), 카운트다운 초, 화면 꺼짐 방지, 최근 포즈 기록 지우기, 포즈 목록.
사진은 서버로 보내지 않고, '처음으로'를 누르면 브라우저 메모리에서 지운다.
