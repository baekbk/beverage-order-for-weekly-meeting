import { Redis } from '@upstash/redis';

// Vercel의 Upstash(Marketplace) 연동을 프로젝트에 붙이면
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 환경변수가 자동 주입됩니다.
const redis = Redis.fromEnv();

const ORDERS_KEY = 'coffee:orders';
const META_KEY = 'coffee:meta';
const SEEDED_KEY = 'coffee:seeded';

// index.html의 SEED_BATCHES와 동일한 과거 이력 데이터 (최초 1회만 주입)
const SEED_BATCHES = {
  seed_loop: {
    '탁근찬': '아메리카노 (Ice)', '이은우': '아메리카노 (Hot)', '심규빈': '아메리카노 (Ice)',
    '이윤라': '아메리카노 (Hot)', '홍석진': '아메리카노 (Ice)', '서준영': '아메리카노 (Hot)',
    '원민경': '카페라떼 (Ice)'
  },
  seed_0624: {
    '김향': '허니 유자 페퍼민트 (Hot)', '이윤라': '아메리카노 (Hot)', '이은우': '아메리카노 (Hot)',
    '김규동': '레몬에이드', '홍석진': '바닐라라떼 (Ice)', '서준영': '바닐라라떼 (Ice)',
    '심규빈': '아메리카노 (Ice)', '원민경': '수제밀크티 (Ice)', '탁근찬': '아메리카노 (Ice)',
    '백부경': '허니 유자 페퍼민트 (Hot)'
  },
  seed_0902: {
    '김형효': '카페라떼 (Ice)', '탁근찬': '아메리카노 (Ice)', '이윤라': '꿀대추차 (Hot)',
    '백부경': '말차라떼(제주우유가능) (Ice)', '김규동': '아메리카노 (Ice)', '홍석진': '아메리카노 (Ice)',
    '서준영': '아메리카노 (Hot)', '김혜림': '말차라떼(제주우유가능) (Ice)', '이은우': '아메리카노 (Hot)',
    '심규빈': '아메리카노 (Ice)'
  },
  seed_wolning: {
    '탁근찬': '아메리카노 (Ice)', '이윤라': '쌍화차 (Hot)', '원민경': '카페라떼 (Ice)',
    '백부경': '바닐라라떼 (Ice)', '김형효': '카페라떼 (Ice)', '홍석진': '아메리카노 (Ice)',
    '서준영': '아메리카노 (Ice)', '김혜림': '아메리카노 (Ice)', '이은우': '아메리카노 (Hot)',
    '심규빈': '아메리카노 (Ice)'
  }
};

async function ensureSeeded() {
  const seeded = await redis.get(SEEDED_KEY);
  if (seeded) return;
  for (const [batchId, entries] of Object.entries(SEED_BATCHES)) {
    for (const [member, menu] of Object.entries(entries)) {
      const docId = `${batchId}_${member}`;
      await redis.hset(ORDERS_KEY, { [docId]: { date: batchId, member, menu } });
    }
  }
  await redis.set(SEEDED_KEY, '1');
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      await ensureSeeded();
      const [orders, meta] = await Promise.all([
        redis.hgetall(ORDERS_KEY),
        redis.hgetall(META_KEY)
      ]);
      res.status(200).json({ orders: orders || {}, meta: meta || {} });
      return;
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const { type, docId, data } = body;
      if (!type || !docId || !data) {
        res.status(400).json({ error: 'type, docId, data가 모두 필요합니다.' });
        return;
      }
      if (type === 'order') {
        await redis.hset(ORDERS_KEY, { [docId]: data });
      } else if (type === 'meta') {
        await redis.hset(META_KEY, { [docId]: data });
      } else {
        res.status(400).json({ error: '알 수 없는 type 입니다.' });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
