import { DayPlan } from './types';

export const ITINERARY_DATA: DayPlan[] = [
  {
    id: 1,
    dateLabel: "Day 1",
    title: "抵達曼谷与河畔饗宴",
    subtitle: "抵達日輕鬆走",
    activities: [
      {
        time: "下午",
        title: "抵達 BKK / DMK 機場",
        description: "前往飯店入住或寄放行李",
        location: "Bangkok Suvarnabhumi Airport",
        category: "transport",
        tags: [{ label: "Grab叫車", type: "tip" }]
      },
      {
        time: "晚上",
        title: "Copper Beyond Buffet",
        description: "曼谷著名的自助餐饗宴，和牛船麵與松露湯是必點。",
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
    id: 2,
    dateLabel: "Day 2",
    title: "河岸文化巡禮",
    subtitle: "最順的河岸文化動線",
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
        description: "用餐、逛水上市場區域、欣賞河景。",
        location: "ICONSIAM",
        category: "shopping",
        tags: [
            { label: "必逛:室內水上市場", type: "must-buy" },
            { label: "必看:河濱水舞秀", type: "tip" }
        ]
      }
    ]
  },
  {
    id: 3,
    dateLabel: "Day 3",
    title: "精緻美食與購物",
    subtitle: "你指定的重點購物日",
    activities: [
      {
        time: "中午",
        title: "藍象餐廳 Blue Elephant",
        description: "米其林推薦的皇家泰式料理。",
        location: "Blue Elephant Cooking School & Restaurant Bangkok",
        category: "food",
        tags: [{ label: "需預約", type: "reservation" }, { label: "經典:黃咖哩", type: "must-eat" }]
      },
      {
        time: "下午～晚上",
        title: "CentralWorld 深度購物",
        description: "曼谷最大的購物中心之一，集結各大香氛品牌。",
        location: "centralwOrld",
        category: "shopping",
        tags: [
          { label: "必買:Butterfly Thai Perfume 芒果糯米飯味", type: "must-buy" },
          { label: "必逛:Karmakamet", type: "must-buy" },
          { label: "必逛:PAÑPURI", type: "must-buy" },
          { label: "選物:Frank Garçon", type: "must-buy" }
        ]
      },
      {
        time: "晚餐",
        title: "CentralWorld 內享用晚餐",
        description: "商場內有多樣化的餐廳選擇。",
        location: "centralwOrld",
        category: "food",
      }
    ]
  },
  {
    id: 4,
    dateLabel: "Day 4",
    title: "文青咖啡與暹羅商圈",
    subtitle: "輕鬆＋美食重點日",
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
        title: "Siam 商圈漫步",
        description: "Siam Square / Siam Center。主打年輕品牌與日韓風格購物。",
        location: "Siam Square One",
        category: "shopping",
        tags: [{ label: "年輕潮牌", type: "tip" }]
      },
      {
        time: "晚上",
        title: "朱拉隆功美食一條街",
        description: "Banthat Thong Road，各式道地泰式小吃自由選。",
        location: "Banthat Thong Road",
        category: "food",
        tags: [{ label: "必吃:Jeh O Chula 媽媽麵", type: "must-eat" }, { label: "甜點:米其林豆漿", type: "must-eat" }]
      }
    ]
  },
  {
    id: 5,
    dateLabel: "Day 5",
    title: "恰圖恰與新地標",
    subtitle: "市集＋新商場",
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
        description: "世界最大的週末市集（週六日限定）。",
        location: "Chatuchak Weekend Market",
        category: "shopping",
        tags: [{ label: "注意:只開週末", type: "tip" }, { label: "必吃:椰子冰淇淋", type: "must-eat" }]
      },
      {
        time: "傍晚～晚上",
        title: "Dusit Central Park",
        description: "探索曼谷的新興綜合開發區。",
        location: "Dusit Central Park",
        category: "sightseeing",
      },
      {
        time: "晚餐",
        title: "商場內晚餐",
        description: "於 Dusit Central Park 內解決。",
        location: "Dusit Central Park",
        category: "food",
      }
    ]
  },
  {
    id: 6,
    dateLabel: "Day 6",
    title: "告別曼谷",
    subtitle: "收尾日",
    activities: [
      {
        time: "早上",
        title: "最後的放鬆",
        description: "享受豐盛早餐或最後一次泰式按摩。",
        category: "relax",
      },
      {
        time: "下午",
        title: "前往機場",
        description: "預留充足時間前往 BKK 或 DMK。",
        location: "Suvarnabhumi Airport",
        category: "transport",
        tags: [{ label: "建議提早3小時", type: "tip" }]
      },
      {
        time: "機場購物",
        title: "免稅店採買",
        description: "購買 PAÑPURI 香氛產品，價格通常較市區優惠。",
        location: "King Power Duty Free",
        category: "shopping",
        tags: [{ label: "必買:PAÑPURI", type: "must-buy" }]
      }
    ]
  }
];