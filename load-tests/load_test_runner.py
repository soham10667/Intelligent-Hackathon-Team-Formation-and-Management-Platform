import asyncio
import time
import statistics
import random
import sys
import os
from typing import List

sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "backend")))

import httpx
from app.main import app

CATEGORIES = ["AI/ML", "Web3", "Developer Tools", "General"]
CONCURRENT_VUS = 25
TEST_DURATION_SEC = 5.0

async def single_request(client: httpx.AsyncClient, user_id: int, latencies: List[float], errors: List[str]):
    category = random.choice(CATEGORIES)
    start = time.perf_counter()
    try:
        res = await client.get(
            f"/api/teams/discovery?category={category}&only_open_seats=true&limit=20"
        )
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        if res.status_code == 200:
            latencies.append(elapsed_ms)
        else:
            errors.append(f"HTTP {res.status_code}")
    except Exception as e:
        errors.append(str(e))

async def virtual_user_worker(client: httpx.AsyncClient, vu_id: int, duration_sec: float, latencies: List[float], errors: List[str]):
    # Random initial stagger
    await asyncio.sleep(random.uniform(0.01, 0.2))
    end_time = time.perf_counter() + duration_sec
    while time.perf_counter() < end_time:
        await single_request(client, vu_id, latencies, errors)
        await asyncio.sleep(random.uniform(0.05, 0.12))

async def run_benchmark():
    print(f"============================================================", flush=True)
    print(f" TEAM DISCOVERY LOAD TEST: {CONCURRENT_VUS} CONCURRENT VIRTUAL USERS", flush=True)
    print(f" Sustained {TEST_DURATION_SEC}s test simulating high-throughput team discovery", flush=True)
    print(f" Target SLA: p95 latency < 200 ms", flush=True)
    print(f"============================================================", flush=True)

    latencies: List[float] = []
    errors: List[str] = []

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test", timeout=30.0) as client:
        # Warmup
        await client.get("/api/teams/discovery?limit=10")
        
        # Concurrent Virtual Users sustained over time window
        start_total = time.perf_counter()
        tasks = [virtual_user_worker(client, uid, TEST_DURATION_SEC, latencies, errors) for uid in range(CONCURRENT_VUS)]
        await asyncio.gather(*tasks)
        total_time = time.perf_counter() - start_total

    if not latencies:
        print(f"ERROR: No successful requests completed! Errors: {errors[:5]}", flush=True)
        return

    latencies.sort()
    count = len(latencies)
    p50 = latencies[int(count * 0.50)]
    p90 = latencies[int(count * 0.90)]
    p95 = latencies[int(count * 0.95)]
    p99 = latencies[int(count * 0.99)]
    avg = statistics.mean(latencies)
    throughput = count / total_time

    print(f"\n--- LOAD TEST BENCHMARK REPORT ---", flush=True)
    print(f"Simultaneous Virtual Users:  {CONCURRENT_VUS}", flush=True)
    print(f"Total Requests Completed:   {count}", flush=True)
    print(f"Failed Requests:            {len(errors)}", flush=True)
    if errors:
        print(f"Sample Error:               {errors[0]}", flush=True)
    print(f"Total Execution Time:       {total_time:.3f} s", flush=True)
    print(f"Total Execution Time:       {total_time:.3f} s", flush=True)
    print(f"Throughput:                 {throughput:.1f} req/sec", flush=True)
    print(f"Average Latency:            {avg:.2f} ms", flush=True)
    print(f"p50 (Median):               {p50:.2f} ms", flush=True)
    print(f"p90 Latency:                {p90:.2f} ms", flush=True)
    print(f"p95 Latency:                {p95:.2f} ms  (Target: < 200ms -> {'PASSED ✅' if p95 < 200 else 'FAILED ❌'})", flush=True)
    print(f"p99 Latency:                {p99:.2f} ms", flush=True)
    print(f"Min Latency:                {min(latencies):.2f} ms", flush=True)
    print(f"Max Latency:                {max(latencies):.2f} ms", flush=True)
    print(f"============================================================\n", flush=True)

if __name__ == "__main__":
    asyncio.run(run_benchmark())
