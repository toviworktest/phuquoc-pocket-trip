/* Source of truth: docs/인수인계_원본.md. All unreserved venues remain candidates. */
window.PQ_BASE = {
 version: 1, tripId: 'phuquoc-2026-11', checkedAt: '2026-09-30',
 title: '푸꾸옥, 느긋한 일주일', timezone: 'Asia/Ho_Chi_Minh',
 reservations: [
  {id:'outbound',label:'출국 항공',date:'11.03',detail:'한국 18:00 → 푸꾸옥 22:15',status:'확정 · 인수인계 기준'},
  {id:'vinpearl',label:'Vinpearl Resort & Spa',date:'11.03 – 11.05',detail:'북부 · 2박 · 늦은 체크인',status:'예약 확정'},
  {id:'noska',label:'Noska Hotel Sunset Town',date:'11.05 – 11.08',detail:'남부 · 3박 · Sunset Town',status:'예약 확정'},
  {id:'inbound',label:'귀국 항공',date:'11.08 – 11.09',detail:'푸꾸옥 23:15 → 한국 06:35',status:'확정 · 인수인계 기준'}
 ],
 places: {
  airport:{name:'푸꾸옥 국제공항',query:'Phu Quoc International Airport',region:'중부'},
  vinpearl:{name:'Vinpearl Resort & Spa Phu Quoc',query:'Vinpearl Resort & Spa Phu Quoc',region:'북부'},
  safari:{name:'Vinpearl Safari',query:'Vinpearl Safari Phu Quoc',region:'북부'},
  wonders:{name:'VinWonders · Sea Shell',query:'VinWonders Phu Quoc',region:'북부'},
  grand:{name:'Grand World',query:'Grand World Phu Quoc',region:'북부'},
  sen:{name:'나항센 · 지점 확인 필요',query:'Nha Hang Sen Phu Quoc',region:'중부'},
  noska:{name:'Noska Hotel',query:'Noska Hotel 06-08 Venice Sunset Town Phu Quoc',region:'남부',address:'06–08 Venice, Sunset Town',source:'https://www.noskahotel.com/'},
  cable:{name:'혼똔 케이블카 · 안토이역',query:'Hon Thom Cable Car An Thoi Station Phu Quoc',region:'남부'},
  aqua:{name:'혼똔섬 · Aquatopia',query:'Aquatopia Water Park Hon Thom Phu Quoc',region:'남부'},
  sunset:{name:'Sunset Town 산책',query:'Sunset Town Phu Quoc',region:'남부'},
  market:{name:'Sunset Town 야시장',query:'VUI Fest Bazaar Phu Quoc',region:'남부'},
  kiss:{name:'Kiss of the Sea',query:'Kiss of the Sea Phu Quoc',region:'남부'},
  bun:{name:'분꽈이 끼엔서이 · 지점 확인 필요',query:'Bun Quay Kien Xay Duong Dong Phu Quoc',region:'중부'},
  duong:{name:'즈엉동 거리 구경',query:'Duong Dong Phu Quoc',region:'중부'},
  kingkong:{name:'KingKong Mart · 지점 확인 필요',query:'King Kong Mart Tran Hung Dao Phu Quoc',region:'중부'}
 },
 days: [
  {id:'2026-11-03',weekday:'화',title:'밤 비행, 북부로',region:'이동',intro:'늦은 도착 후 호텔에서 푹 쉬는 날.',stay:'Vinpearl · 1박째',prep:['여권 · 항공 예약 내역','호텔 픽업 연락처 · 항공편명'],events:[
   {id:'d1-flight',time:'18:00',fixedTime:true,zone:'한국',title:'한국 출발',mode:'flight',status:'confirmed',note:'항공시간 고정. 출발 공항과 항공편명은 인수인계 문서에 없음.'},
   {id:'d1-arrive',time:'22:15',fixedTime:true,zone:'베트남',title:'푸꾸옥 도착',place:'airport',mode:'flight',status:'confirmed',note:'입국 · 수하물 수령 후 픽업 미팅.'},
   {id:'d1-hotel',time:'늦은 밤',title:'Vinpearl 체크인 · 휴식',place:'vinpearl',mode:'car',status:'confirmed',note:'호텔 공항 픽업 이용 계획. 배차·비용·대기시간 확인 필요. 자정 이후 도착 가능성을 호텔에 전달. 관광 일정 없음.'}
  ]},
  {id:'2026-11-04',weekday:'수',title:'동물과 바다, 북부의 하루',region:'북부',intro:'Safari → VinWonders → 리조트 수영장 → Grand World 순서 고정.',stay:'Vinpearl · 2박째',start:'vinpearl',prep:['Safari 차량 체험 먼저','수영복 · 리조트에서 환복','최신 셔틀 시간은 프런트 확인'],events:[
   {id:'d2-safari',time:'오전',title:'Vinpearl Safari',place:'safari',mode:'car',status:'planned',note:'가능하면 일찍 출발. 내부 Safari 차량 체험 우선, 이후 일반 동물원. VinBus·숙소 셔틀 시간 미확정.'},
   {id:'d2-wonders',time:'점심 무렵',title:'VinWonders · Sea Shell 아쿠아리움',place:'wonders',mode:'car',status:'planned',note:'아쿠아리움 중심. 놀이기구·산책은 여유에 따라. Typhoon World 워터파크 제외.'},
   {id:'d2-pool',time:'오후',title:'리조트 수영장 · 해변',place:'vinpearl',mode:'car',status:'planned',note:'숙소로 돌아와 물놀이와 휴식. 샤워·환복 후 저녁 외출.'},
   {id:'d2-grand',time:'저녁',title:'Grand World 야경',place:'grand',mode:'car',status:'planned',note:'베니스 운하 산책. 공연은 당일 운영·컨디션 확인 후 선택.'},
   {id:'d2-return',time:'밤',title:'숙소 복귀',place:'vinpearl',mode:'car',status:'planned',note:'복귀 셔틀 막차 확인.'}
  ]},
  {id:'2026-11-05',weekday:'목',title:'북부에서 남부로, 천천히',region:'북부 → 남부',intro:'체크아웃 → 공항 드랍 → 점심 후보 → Noska. 이동과 휴식에 집중.',stay:'Noska · 1박째',start:'vinpearl',prep:['호텔 공항 드랍 시간','공항 이후 차량 · 대기 · 캐리어 처리'],events:[
   {id:'d3-checkout',time:'오전',title:'조식 · Vinpearl 체크아웃',place:'vinpearl',mode:'stay',status:'confirmed',note:'11/5 체크아웃 고정. 호텔의 실제 체크아웃 마감·드랍 시간을 확인.'},
   {id:'d3-airport',time:'드랍 시간 미정',title:'호텔 공항 드랍',place:'airport',mode:'car',status:'check',note:'이용 계획이며 배차가 확정된 예약은 아님.'},
   {id:'d3-sen',time:'점심',title:'나항센 · 점심 후보',place:'sen',mode:'car',status:'check',note:'쌀국수 · 반쎄오. 할아버지 맥주 브랜드·판매 여부 미확인. 정확한 지점과 짐 보관·차량 대기부터 확인.'},
   {id:'d3-noska',time:'오후',title:'Noska 체크인 · 휴식',place:'noska',mode:'car',status:'confirmed',note:'11/5~11/8 3박 예약 확정. 이른 체크인 가능 여부는 별도.'},
   {id:'d3-walk',time:'해 질 무렵',title:'Sunset Town 산책 · 가벼운 저녁',place:'sunset',mode:'walk',status:'planned',note:'선셋·야경. 불꽃놀이는 실제 운영 여부에 따라.'},
   {id:'d3-return',time:'밤',title:'Noska 복귀',place:'noska',mode:'walk',status:'planned',note:'휴식.'}
  ]},
  {id:'2026-11-06',weekday:'금',title:'혼똔의 물빛, 남부의 노을',region:'남부',intro:'혼똔섬은 별도 하루. 호텔 샤워와 휴식을 넣고 저녁 일정으로.',stay:'Noska · 2박째',start:'noska',prep:['수영복 · 아쿠아슈즈 · 방수팩','장신구·지퍼 제한 재확인','케이블카 마지막 복귀편 · 공연시간'],events:[
   {id:'d4-cable',time:'오전',title:'안토이 케이블카역',place:'cable',mode:'walk',status:'check',note:'Noska에서 도보 이동 계획. 11/6 실제 운행시간·발권 마감 확인.'},
   {id:'d4-aqua',time:'오전–오후',title:'혼똔섬 · Aquatopia',place:'aqua',mode:'cable',status:'planned',note:'워터파크 · 점심 · 수영 · 휴식. 케이블카/워터파크 포함권 조건 확인.'},
   {id:'d4-cableback',time:'오후',title:'케이블카로 안토이 복귀',place:'cable',mode:'cable',status:'check',note:'마지막 운행 직전까지 머물지 않도록 여유 확보. 실제 막차 미확인.'},
   {id:'d4-shower',time:'오후',title:'Noska 샤워 · 환복 · 휴식',place:'noska',mode:'walk',status:'planned',note:'저녁 외출 전 충분히 쉬기.'},
   {id:'d4-massage',time:'선셋 전후 조정',title:'남부 마사지 · 업체 미정',mode:'walk',status:'check',note:'호텔 복귀 후 이용. 선셋과 겹치지 않게 시간을 정할 것.'},
   {id:'d4-sunset',time:'해 질 무렵',title:'선셋 카페·레스토랑 · 장소 미정',mode:'walk',status:'check',note:'Sunset Town 안에서 선택. 후보 비교 탭에 조사 기록. 예약 가능 여부·가격·한국인 후기 미확인.'},
   {id:'d4-market',time:'저녁',title:'Sunset Town 야시장',place:'market',mode:'walk',status:'planned',note:'먹고 싶은 음식: 연포크랩 튀김(인수인계 표기 유지). 실제 메뉴명·판매점 확인 필요.'},
   {id:'d4-show',time:'공연시간 확인',title:'Kiss of the Sea · 불꽃놀이',place:'kiss',mode:'walk',status:'check',note:'11/6 공연 유무·시작시간·입장 마감·좌석·티켓 포함사항 확인. 아직 예매 확정 아님.'},
   {id:'d4-return',time:'공연 후',title:'Noska 도보 복귀',place:'noska',mode:'walk',status:'planned',note:'도보 동선의 계단·경사·출입 제한을 현장에서 확인.'}
  ]},
  {id:'2026-11-07',weekday:'토',title:'세 개의 섬, 한가로운 바다',region:'남부',intro:'3섬 스피드보트 호핑. 돌아온 뒤 중부로 올라가지 않기.',stay:'Noska · 3박째',start:'noska',prep:['픽업 지점 · 시간','스노클 장비 · 점심 · 사진 · 드론 포함 확인','날씨 변경·취소 조건'],events:[
   {id:'d5-pickup',time:'픽업시간 미정',title:'Noska 또는 인근 픽업',mode:'car',status:'check',note:'업체 선정 전. 호텔 문 앞 픽업과 정류장 집결을 구분해서 확인.'},
   {id:'d5-islands',time:'낮',title:'남부 3섬 스피드보트 호핑',mode:'boat',status:'check',note:'스노클링 · 해변 · 점심 · 사진/드론 선호. Gam Ghi·May Rut·Mong Tay 등은 후보이며 실제 섬·순서는 업체와 날씨에 따라.'},
   {id:'d5-return',time:'16–17시 예상',title:'Noska 복귀 · 샤워 · 휴식',place:'noska',mode:'car',status:'planned',note:'투어 종료시간과 Noska 도착시간은 다를 수 있음. 컨디션 회복.'},
   {id:'d5-evening',time:'저녁',title:'Sunset Town 자유시간',place:'sunset',mode:'walk',status:'planned',note:'남부에서 저녁·산책. 불꽃놀이는 운영 여부 확인.'},
   {id:'d5-night',time:'밤',title:'Noska 복귀',place:'noska',mode:'walk',status:'planned',note:'휴식.'}
  ]},
  {id:'2026-11-08',weekday:'일',title:'중부 산책, 여행을 담아',region:'남부 → 중부',intro:'쇼핑 후 마사지·샤워, 20:00–20:30 공항 도착 목표.',stay:'23:15 귀국편',start:'noska',prep:['마사지숍 사전 짐 보관','90–120분 코스 · 샤워 · 공항 샌딩','수하물 재정리 · 항공사 마감 확인'],events:[
   {id:'d6-checkout',time:'오전',title:'Noska 체크아웃',place:'noska',mode:'stay',status:'confirmed',note:'11/8 체크아웃 고정. 중부 마사지숍에 짐을 먼저 맡길 수 있는지 확인 필요.'},
   {id:'d6-bun',time:'점심',title:'분꽈이 끼엔서이',place:'bun',mode:'car',status:'planned',note:'즈엉동 지점 주소 확정 후 이동. 아직 특정 지점을 임의로 선택하지 않음.'},
   {id:'d6-walk',time:'오후',title:'즈엉동 거리 · 카페',place:'duong',mode:'walk',status:'planned',note:'로컬 거리 산책. 딘까우는 여유에 따라 추가.'},
   {id:'d6-shop',time:'오후',title:'KingKong Mart 마지막 쇼핑',place:'kingkong',mode:'car',status:'planned',note:'과자 · 후추 · 소스 · 기념품. 지점과 차량 이동시간 확인.'},
   {id:'d6-spa',time:'저녁 · 시간 미정',title:'마사지 90–120분 · 샤워',mode:'car',status:'check',note:'짐 보관·샤워·공항 샌딩 필수. 예시 역산: 17:00 마사지(120분) → 19:00 샤워·짐정리 → 19:45 출발. 업체 거리·샌딩 확정 후 조정.'},
   {id:'d6-airport',time:'20:00–20:30',title:'공항 도착 목표',place:'airport',mode:'car',status:'planned',note:'목표시간이며 차량 예약 아님. 실제 도로 교통·항공사 체크인 마감 반영.'},
   {id:'d6-flight',time:'23:15',fixedTime:true,zone:'베트남',title:'푸꾸옥 출발',place:'airport',mode:'flight',status:'confirmed',note:'귀국 항공시간 고정.'}
  ]},
  {id:'2026-11-09',weekday:'월',title:'한국 도착',region:'귀국',intro:'여행의 여운을 안고 집으로.',stay:'한국 도착',prep:['수하물 찾기'],events:[
   {id:'d7-arrive',time:'06:35',fixedTime:true,zone:'한국',title:'한국 도착',mode:'flight',status:'confirmed',note:'한국 현지시간. 도착 공항·항공편명은 확인 필요.'}
  ]}
 ],
 checklist:[
  {id:'pickup',priority:'우선',title:'Vinpearl 도착 픽업 · 늦은 체크인',detail:'항공편명 전달, 22:15 착륙 후 대기·연착 대응·비용 확인.'},
  {id:'drop',priority:'우선',title:'11/5 공항 드랍 + 다음 차량',detail:'호텔 드랍 시간 → 나항센 정확한 지점 → 캐리어·대기 포함 차량 견적.'},
  {id:'tour',priority:'우선',title:'11/7 호핑투어 선정',detail:'2명 총액, Noska/정류장 픽업, 3섬, 장비, 점심, 사진·드론, 한국인 후기, 기상 취소.'},
  {id:'sunset',priority:'우선',title:'11/6 선셋 장소',detail:'Sunset Town 내 좌석·예약·가격·한국인 후기, 마사지와 시간 충돌 확인.'},
  {id:'lastspa',priority:'우선',title:'11/8 마사지·샤워·공항 샌딩',detail:'90~120분, 짐 보관 시작시각, 2인 최종가, 19:45 전후 샌딩 가능 여부.'},
  {id:'cable',priority:'출발 전',title:'11/6 케이블카 운행시간',detail:'공식 당일 시간표, 중간 휴식·마지막 복귀편. 과거 시간표 확정값 사용 금지.'},
  {id:'show',priority:'출발 전',title:'11/6 Kiss of the Sea',detail:'공연 유무·시간·입장 마감·취소·불꽃놀이·티켓 포함 확인.'},
  {id:'aqua',priority:'출발 전',title:'Aquatopia 입장·복장',detail:'장신구·지퍼·아쿠아슈즈 제한은 놀이기구별 공식 규정 확인.'},
  {id:'shuttle',priority:'현지',title:'11/4 북부 셔틀',detail:'Safari → VinWonders → 리조트 → Grand World 순서 유지. 호텔 복귀 막차도 확인.'},
  {id:'beer',priority:'미정',title:'나항센 메뉴 · 할아버지 맥주',detail:'정확한 브랜드·판매 여부, 쌀국수·반쎄오, 짐 보관.'},
  {id:'bags',priority:'미정',title:'11/8 캐리어 보관 연결',detail:'Noska에서 가져온 짐을 중부 마사지숍에 점심 전 맡길 수 있는지 확인. 동선 반영은 확정 후.'},
  {id:'southspa',priority:'미정',title:'11/6 남부 마사지',detail:'Noska 도보권, 소요시간·예약·선셋 전후 배치.'},
  {id:'branches',priority:'미정',title:'식당·마트 지점 및 출입구',detail:'나항센·끼엔서이·KingKong 정확한 지점, Noska·케이블카 보행 출입구 확인.'}
 ],
 candidates:[
  {id:'johns',group:'11/7 · 호핑',name:'John’s Tours · 3 Islands by Speedboat',tag:'우선 비교 후보',price:'게시가 US$33 / 성인 · 2인 US$66',facts:'3섬 스피드보트, 점심·스노클 장비·구명조끼, 드론 영상 1개·사진 3장 안내. Sunset Town 버스 정류장 무료 픽업 09:15 안내.',unknown:'Noska 앞 픽업, 11/7 실제 섬 구성·최종가·복귀시각·최근 한국인 후기는 미확인. 게시가가 여행일 견적을 뜻하지 않음.',assessment:'현재 요구사항과 가장 직접적으로 맞는 비교 후보. 호텔 앞 픽업이 아니어도 인근 정류장 이용 가능성을 확인.',url:'https://phuquoctrip.com/en/daily-boat-trips/speed-boat-3-islands-trip-in-the-south-phu-quoc.html'},
  {id:'rooty',group:'11/7 · 호핑',name:'Rooty Trip · 3 Islands by Speedboat',tag:'비교 후보',price:'날짜별 견적 문의',facts:'스피드보트, 점심, DSLR 사진·드론 촬영 안내. 공개 기본 일정은 중부 호텔 픽업과 진주센터 방문 포함.',unknown:'Noska 인근 합류·진주센터 생략 가능 여부, 11/7 총액·스노클 장비 상세·한국인 후기 확인 필요.',assessment:'남부 숙박 중 중부 집결을 요구하면 이동 부담이 큼. 남부 합류가 가능한 경우 비교.',url:'https://rootytrip.com/en/product/3-islands-by-speedboat-trip/'},
  {id:'yuju',group:'11/8 · 마사지',name:'YUJU SPA',tag:'필수 조건 확인 후보',price:'90–120분 2인 최종가 문의',facts:'99A Tran Hung Dao. 짐 보관·온수 샤워 안내. FAQ는 성인 2인 이상 90분 이상 이용 시 픽업 또는 샌딩 편도 1회 조건을 안내.',unknown:'본문 VIP 코스 조건과 FAQ 표현 차이: 선택 코스 적용 여부 재확인. 영업시간, 당일 짐 보관 시작시각·샤워·공항 샌딩 슬롯, 청결 관련 최근 한국인 후기 미검증.',assessment:'11/8 필수 조건에 맞을 가능성이 있어 우선 문의할 후보. 샌딩 시간을 서면으로 확인한 뒤 선택.',url:'https://yujuspa-pq.net/'},
  {id:'bavaria',group:'11/6 · 선셋',name:'Sun Bavaria GastroPub',tag:'동선상 후보',price:'좌석·메뉴·최소주문액 문의',facts:'Sun Group 안내에 Sunset Town 해변 식사·맥주·노을 감상 장소로 소개됨.',unknown:'11/6 바다 방향 좌석 예약, 가격, 한국인 후기 확인 필요. 공연 패키지 포함 내용을 기존 Kiss of the Sea 계획과 비교.',assessment:'Noska와 같은 Sunset Town 안에서 검토. 야시장 식사와 겹치므로 가벼운 주문 가능 여부부터 확인.',url:'https://sunparadiseland.com/en/SunParadiseLandPhuQuoc/tin-tuc/phu-quoc-beachfront-beer-gardens-top-spots-for-enjoying-beer-and-watching-the-sunset-24586'}
 ]
};
window.PQ_GEOMETRY = window.PQ_GEOMETRY || {places:{},routes:[],checkedAt:null};
