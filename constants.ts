
import { DayPlan } from './types';

export const ITINERARY_DATA: DayPlan[] = [
  // --- 馬來西亞行程 (New) ---
  {
    id: 1,
    dateLabel: "Day 1 • 12/20 (六)",
    title: "啟程前往吉隆坡",
    subtitle: "台灣 ✈️ 吉隆坡｜Mamak 體驗",
    // Image: KL Airport / Airplane
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
    imgPos: "center 50%",
    activities: [
      {
        time: "07:00",
        title: "抵達機場報到",
        description: "預計 09:20 起飛。建議預留充裕時間辦理登機與安檢。",
        location: "Taoyuan International Airport",
        category: "transport",
        tags: [{ label: "航班:TW Flight", type: "tip" }]
      },
      {
        time: "16:00",
        title: "抵達吉隆坡 (KLIA)",
        description: "預計 15:30 ~ 16:00 出關，準備前往市區。",
        location: "Kuala Lumpur International Airport",
        category: "transport",
        tags: [{ label: "入境手續", type: "nav" }]
      },
      {
        time: "晚上",
        title: "道地 Mamak 晚餐",
        description: "體驗馬來西亞國民美食。推薦嘗試烤餅 (Naan) 或沙嗲 (Satay)。",
        location: "Jalan Alor", 
        category: "food",
        tags: [
          { label: "必吃:Naan", type: "must-eat" },
          { label: "必吃:Satay", type: "must-eat" }
        ]
      }
    ]
  },
  {
    id: 2,
    dateLabel: "Day 2 • 12/21 (日)",
    title: "馬六甲古城巡禮",
    subtitle: "世界文化遺產一日遊",
    // Image: Melaka Red Square / Church
    image: "https://images.unsplash.com/photo-1581007871115-f14bc016e0a4?auto=format&fit=crop&w=800&q=80",
    imgPos: "center 50%",
    activities: [
      {
        time: "上午",
        title: "傳統茶室早餐",
        description: "前往 Kopi Diem 享用道地早餐。",
        location: "Kopi Diem",
        category: "food",
        tags: [{ label: "必點:Kaya Toast", type: "must-eat" }]
      },
      {
        time: "中午",
        title: "前往馬六甲",
        description: "開車前往馬六甲 (Drive to Malaka)，車程約 2-2.5 小時。",
        location: "Melaka",
        category: "transport",
        tags: [{ label: "自駕移動", type: "nav" }]
      },
      {
        time: "下午",
        title: "馬六甲市區觀光",
        description: "遊覽荷蘭紅屋、雞場街等歷史景點。",
        location: "Dutch Square (Red Square) Melaka",
        category: "sightseeing",
        tags: [{ label: "世界遺產", type: "tip" }]
      },
      {
        time: "晚上",
        title: "雞場街夜市",
        description: "Jonker Walk Night Market，感受熱鬧氛圍與街頭美食。",
        location: "Jonker Street Night Market",
        category: "food",
        tags: [{ label: "週末限定", type: "tip" }]
      },
      {
        time: "住宿",
        title: "Swiss Heritage Hotel",
        description: "入住充滿歷史風情的飯店。",
        location: "Swiss Heritage Hotel Melaka",
        category: "relax",
        tags: [{ label: "特色住宿", type: "tip" }]
      }
    ]
  },
  {
    id: 3,
    dateLabel: "Day 3 • 12/22 (一)",
    title: "重返吉隆坡",
    subtitle: "城市漫步 KL City Walk",
    // Image: KL Petronas Towers (Stable Source)
    image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80",
    imgPos: "center 30%",
    activities: [
      {
        time: "上午",
        title: "馬六甲悠閒早餐",
        description: "在古城區享用早餐 (Malaka Cafe Breakfast)。",
        location: "Melaka",
        category: "food"
      },
      {
        time: "下午",
        title: "返回吉隆坡",
        description: "開車返回吉隆坡市區 (Malaka drive to KL)。",
        location: "Kuala Lumpur",
        category: "transport"
      },
      {
        time: "傍晚",
        title: "吉隆坡市區漫步",
        description: "KL City Walk，探索雙子星塔周邊或武吉免登區。",
        location: "Pavilion Kuala Lumpur",
        category: "sightseeing",
        tags: [{ label: "城市夜景", type: "tip" }]
      },
      {
        time: "住宿",
        title: "KL City Airbnb",
        description: "入住吉隆坡市中心 Airbnb。",
        location: "Kuala Lumpur City Centre",
        category: "relax",
        tags: [{ label: "市中心", type: "nav" }]
      }
    ]
  },
  {
    id: 4,
    dateLabel: "Day 4 • 12/23 (二)",
    title: "吉隆坡購物日",
    subtitle: "商場採買與移動",
    // Image: Modern Mall Interior
    image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80",
    imgPos: "center 50%",
    activities: [
      {
        time: "上午",
        title: "移動至外圍區域",
        description: "從市中心移動到吉隆坡外圍 (City to KL Outskirt)。",
        category: "transport"
      },
      {
        time: "下午",
        title: "商場購物採買",
        description: "在路途中的 Mall 逛街與採買戰利品 (Purchase!)。",
        category: "shopping",
        tags: [{ label: "採購日", type: "must-buy" }]
      },
      {
        time: "晚上",
        title: "自由活動",
        description: "整理行李，準備隔天前往泰國。",
        category: "relax"
      }
    ]
  },

  // --- 原有曼谷行程 (順延並更新日期) ---
  {
    id: 5,
    dateLabel: "Day 5 • 12/24 (三)",
    title: "抵達曼谷與河畔饗宴",
    subtitle: "轉機抵達｜平安夜大餐",
    // Image: Luxury Dining / Night View
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80",
    imgPos: "center 30%", 
    activities: [
      {
        time: "下午",
        title: "抵達 DMK 廊曼機場",
        description: "前往飯店入住或寄放行李",
        location: "Don Mueang International Airport",
        category: "transport",
        tags: [{ label: "Grab叫車", type: "tip" }]
      },
      {
        time: "晚上",
        title: "Copper Beyond Buffet",
        description: "曼谷著名的自助餐饗宴，和牛船麵與松露湯是必點。平安夜享受奢華美食。",
        location: "Copper Beyond Buffet",
        category: "food",
        tags: [
          { label: "建議提前訂位", type: "reservation" },
          { label: "必吃:和牛船麵", type: "must-eat" },
          { label: "必吃:松露湯", type: "must-eat" }
        ]
      },
      {
        time: "深夜",
        title: "休息與放鬆",
        description: "飯後回飯店休息或找間附近的按摩店簡單放鬆。",
        category: "relax",
      }
    ]
  },
  {
    id: 6,
    dateLabel: "Day 6 • 12/25 (四)",
    title: "河岸文化巡禮",
    subtitle: "聖誕節古蹟巡禮",
    // Image: Wat Arun Details
    image: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=800&q=80",
    imgPos: "center 70%",
    activities: [
      {
        time: "早上",
        title: "臥佛寺 Wat Pho",
        description: "曼谷最古老的寺廟之一，擁有巨大的臥佛。",
        location: "Wat Pho",
        category: "sightseeing",
        tags: [{ label: "服裝規定:有袖/過膝", type: "tip" }]
      },
      {
        time: "中午",
        title: "前往鄭王廟",
        description: "步行至 Tha Tien Pier，搭渡船前往對岸。",
        location: "Tha Tien Pier",
        category: "transport",
        tags: [{ label: "票價: 5泰銖", type: "tip" }]
      },
      {
        time: "下午",
        title: "鄭王廟 Wat Arun",
        description: "參觀標誌性的黎明寺，此時段拍照光線最佳。",
        location: "Wat Arun",
        category: "sightseeing",
        tags: [{ label: "最佳拍照點", type: "tip" }]
      },
      {
        time: "傍晚",
        title: "搭船前往 ICONSIAM",
        description: "享受湄南河畔的夕陽景色。",
        location: "ICONSIAM Pier",
        category: "transport"
      },
      {
        time: "晚上",
        title: "ICONSIAM 暹羅天地",
        description: "在河畔享用聖誕晚餐、欣賞水舞秀與華麗裝飾。",
        location: "ICONSIAM",
        category: "shopping",
        tags: [
            { label: "必逛:室內水上市場", type: "must-buy" },
            { label: "必吃:鬼門炒河粉(Thipsamai)", type: "must-eat" }
        ]
      }
    ]
  },
  {
    id: 7,
    dateLabel: "Day 7 • 12/26 (五)",
    title: "精緻美食與購物",
    subtitle: "CentralWorld 男裝與美食攻略",
    // Image: Tom Yum / Thai Food
    image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=800&q=80",
    imgPos: "center 40%",
    activities: [
      {
        time: "中午",
        title: "藍象餐廳 Blue Elephant",
        description: "米其林推薦的皇家泰式料理，享受精緻午宴。",
        location: "Blue Elephant Cooking School & Restaurant Bangkok",
        category: "food",
        tags: [{ label: "需預約", type: "reservation" }, { label: "經典:黃咖哩", type: "must-eat" }]
      },
      {
        time: "下午",
        title: "CentralWorld 深度購物",
        description: "曼谷最大商場。推薦 2F Beacon Zone (男裝/潮牌重鎮)。",
        location: "centralwOrld",
        category: "shopping",
        tags: [
          { label: "潮牌:Carnival (必逛)", type: "must-buy" },
          { label: "機能:Element 72 (Keen)", type: "must-buy" },
          { label: "設計:Good Goods", type: "must-buy" },
          { label: "香氛:Karmakamet", type: "must-buy" }
        ]
      },
      {
        time: "晚餐",
        title: "CentralWorld 美食推薦",
        description: "推薦 3F/6F/7F 餐廳區。",
        location: "centralwOrld",
        category: "food",
        tags: [
            { label: "必吃:Thong Smith (和牛船麵)", type: "must-eat" },
            { label: "必吃:Kub Kao Kub Pla (綠咖哩)", type: "must-eat" },
            { label: "甜點:After You 刨冰", type: "must-eat" }
        ]
      }
    ]
  },
  {
    id: 8,
    dateLabel: "Day 8 • 12/27 (六)",
    title: "文青咖啡與暹羅商圈",
    subtitle: "Siam Square 潮流挖掘",
    // Image: Coffee / Cafe
    image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80",
    imgPos: "center center",
    activities: [
      {
        time: "上午",
        title: "特色咖啡廳巡禮",
        description: "推薦 Factory Coffee – BKK (需排隊)。",
        location: "Factory Coffee - BKK",
        category: "food",
        tags: [
            { label: "必點:Supreme", type: "must-eat" },
            { label: "備選:GalileOasis", type: "tip" },
            { label: "備選:BENKOFF", type: "tip" }
        ]
      },
      {
        time: "下午",
        title: "Siam Square 逛街攻略",
        description: "年輕人的潮流聖地。主攻 Siam Square One 與周邊巷弄。",
        location: "Siam Square One",
        category: "shopping",
        tags: [
            { label: "必逛:Frank Garçon (選物)", type: "must-buy" },
            { label: "必逛:Lido Connect", type: "must-buy" },
            { label: "潮牌:A.S.S (Siam Center)", type: "tip" }
        ]
      },
      {
        time: "晚上",
        title: "朱拉隆功美食一條街",
        description: "Banthat Thong Road，各式道地泰式小吃自由選。",
        location: "Banthat Thong Road",
        category: "food",
        tags: [
          { label: "必吃:Jeh O Chula (媽媽麵)", type: "must-eat" }, 
          { label: "甜點:Nueng Nom Nua (牛奶吐司)", type: "must-eat" }
        ]
      }
    ]
  },
  {
    id: 9,
    dateLabel: "Day 9 • 12/28 (日)",
    title: "恰圖恰與新地標",
    subtitle: "週末市集最終場",
    // Image: Market Vibe
    image: "https://images.unsplash.com/photo-1519098901909-b1553a1190af?auto=format&fit=crop&w=800&q=80",
    imgPos: "center 40%",
    activities: [
      {
        time: "上午",
        title: "悠閒早晨",
        description: "睡晚一點，或在飯店周邊簡單活動。",
        category: "relax",
      },
      {
        time: "下午",
        title: "恰圖恰週末市集 Chatuchak",
        description: "世界最大的週末市集。男生主攻 Section 2, 3, 4 (古著/風格服飾)。",
        location: "Chatuchak Weekend Market",
        category: "shopping",
        tags: [
            { label: "必吃:Viva 8 海鮮飯", type: "must-eat" }, 
            { label: "太熱可逛:Mixt Chatuchak", type: "tip" }
        ]
      },
      {
        time: "傍晚～晚上",
        title: "Dusit Central Park / Silom",
        description: "探索曼谷新地標周邊。若商場未全開，可前往 Silom 區 Saladaeng 覓食。",
        location: "Dusit Central Park",
        category: "sightseeing",
        tags: [{ label: "備選:The Commons Saladaeng", type: "tip" }]
      },
      {
        time: "晚餐",
        title: "Somboon Seafood 建興酒家",
        description: "經典咖哩蟹，適合最後一晚的豐盛晚餐 (Surawong 分店)。",
        location: "Somboon Seafood Surawong",
        category: "food",
        tags: [{ label: "經典:咖哩蟹", type: "must-eat" }, { label: "必點:蒜泥炸蝦", type: "must-eat" }]
      }
    ]
  },
  {
    id: 10,
    dateLabel: "Day 10 • 12/29 (一)",
    title: "告別曼谷",
    subtitle: "收尾日",
    // Image: Travel / Plane
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
    imgPos: "center 60%",
    activities: [
      {
        time: "早上",
        title: "最後的放鬆",
        description: "享受豐盛早餐或最後一次泰式按摩。",
        category: "relax",
      },
      {
        time: "下午",
        title: "前往 BKK 素萬那普機場",
        description: "預留充足時間辦理退稅與登機。",
        location: "Suvarnabhumi Airport",
        category: "transport",
        tags: [{ label: "建議提早3小時", type: "tip" }]
      },
      {
        time: "機場購物",
        title: "免稅店採買",
        description: "1F Magic Food Point 有平價美食。免稅店可買 PAÑPURI 香氛。",
        location: "King Power Duty Free",
        category: "shopping",
        tags: [
            { label: "必買:PAÑPURI", type: "must-buy" },
            { label: "平價:Magic Food Point", type: "must-eat" }
        ]
      }
    ]
  }
];
