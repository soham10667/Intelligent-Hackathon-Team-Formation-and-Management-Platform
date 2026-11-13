import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 25 },  // Ramp-up to 25 VUs
    { duration: '20s', target: 100 }, // Peak 100 concurrent users
    { duration: '20s', target: 100 }, // Sustained load
    { duration: '10s', target: 0 },   // Cool-down
  ],
  thresholds: {
    // 95% of requests must complete below 200ms
    http_req_duration: ['p(95)<200'],
    // 99% of requests must succeed
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8000';

const CATEGORIES = ['AI/ML', 'Web3', 'Developer Tools', 'General'];
const SKILLS = ['Python', 'React', 'FastAPI', 'PyTorch', 'Docker'];

export default function () {
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const skill = SKILLS[Math.floor(Math.random() * SKILLS.length)];
  
  // Test parameterized discovery endpoint with filtering & pagination
  const url = `${BASE_URL}/api/teams/discovery?category=${category}&only_open_seats=true&limit=20`;
  
  const res = http.get(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'k6-load-testing-agent',
    },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has teams': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch (e) {
        return false;
      }
    },
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(0.1 + Math.random() * 0.2); // Jittered human think time
}
