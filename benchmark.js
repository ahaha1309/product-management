const mongoose = require('mongoose');
const orderModel = require('./models/orders.model');
const database = require('./config/database');
const os = require('os');
require('dotenv').config();
const { performance } = require('perf_hooks');

async function runBenchmark() {
  await database.connect();

  console.log("=========================================");
  console.log("   BENCHMARK: IN-MEMORY VS AGGREGATION   ");
  console.log("=========================================\n");

  // --- 1. HARDWARE SPECS ---
  console.log("[HARDWARE]");
  const cpus = os.cpus();
  console.log(`- CPU: ${cpus[0].model} (${cpus.length} cores)`);
  console.log(`- OS: ${os.type()} ${os.release()} (${os.arch()})`);
  console.log(`- Total RAM: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`- Node Version: ${process.version}\n`);

  // --- 2. DATASET SIZE ---
  const datasetSize = await orderModel.countDocuments({ status: 'finish' });
  console.log("[DATASET SIZE]");
  console.log(`- Total Finished Orders: ${datasetSize}\n`);

  // --- 3. METHODOLOGY ---
  const RUNS = 100;
  console.log("[METHODOLOGY]");
  console.log(`- Test Type: Serial Execution`);
  console.log(`- Number of Runs (N): ${RUNS}`);
  console.log(`- Garbage Collection: Forced before each method suite to ensure clean memory state.\n`);

  // Helpers
  const calcStats = (times) => {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const variance = times.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);
    return { avg, min, max, stdDev };
  };

  // --- BENCHMARK 1: IN-MEMORY (OLD) ---
  console.log("[RUNNING IN-MEMORY TESTS (OLD)]...");
  global.gc && global.gc(); // Force GC if available (run with --expose-gc)
  
  const inMemoryTimes = [];
  const startMem1 = process.memoryUsage().heapUsed;

  for (let i = 0; i < RUNS; i++) {
    const t0 = performance.now();
    const allOrders = await orderModel.find({ status: 'finish' }).select('products').lean();
    let productFrequency = {};
    allOrders.forEach(order => {
      order.products.forEach(p => {
        productFrequency[p.productId] = (productFrequency[p.productId] || 0) + p.quantity;
      });
    });
    let sortedProductIds1 = Object.keys(productFrequency).sort((a, b) => productFrequency[b] - productFrequency[a]).slice(0, 12);
    const t1 = performance.now();
    inMemoryTimes.push(t1 - t0);
  }
  const endMem1 = process.memoryUsage().heapUsed;
  const memUsed1 = (endMem1 - startMem1) / 1024 / 1024;

  // --- BENCHMARK 2: AGGREGATION (NEW) ---
  console.log("[RUNNING AGGREGATION TESTS (NEW)]...");
  global.gc && global.gc();

  const aggTimes = [];
  const startMem2 = process.memoryUsage().heapUsed;

  for (let i = 0; i < RUNS; i++) {
    const t0 = performance.now();
    const topProductAgg = await orderModel.aggregate([
      { $match: { status: 'finish' } },
      { $unwind: "$products" },
      { $group: { _id: "$products.productId", totalQuantity: { $sum: "$products.quantity" } } },
      { $sort: { totalQuantity: -1 } },
      { $limit: 12 }
    ]);
    const sortedProductIds2 = topProductAgg.map(p => p._id);
    const t1 = performance.now();
    aggTimes.push(t1 - t0);
  }
  const endMem2 = process.memoryUsage().heapUsed;
  const memUsed2 = (endMem2 - startMem2) / 1024 / 1024;

  // --- RESULTS ---
  const statsOld = calcStats(inMemoryTimes);
  const statsNew = calcStats(aggTimes);

  console.log("\n=========================================");
  console.log("               RESULTS                   ");
  console.log("=========================================\n");

  console.log(">> METHOD 1: IN-MEMORY (CŨ)");
  console.log(`- Average Time: ${statsOld.avg.toFixed(2)} ms`);
  console.log(`- Best Case: ${statsOld.min.toFixed(2)} ms`);
  console.log(`- Worst Case: ${statsOld.max.toFixed(2)} ms`);
  console.log(`- Standard Deviation: ±${statsOld.stdDev.toFixed(2)} ms`);
  console.log(`- Max RAM Delta (over ${RUNS} runs): ${memUsed1.toFixed(2)} MB\n`);

  console.log(">> METHOD 2: AGGREGATION (MỚI)");
  console.log(`- Average Time: ${statsNew.avg.toFixed(2)} ms`);
  console.log(`- Best Case: ${statsNew.min.toFixed(2)} ms`);
  console.log(`- Worst Case: ${statsNew.max.toFixed(2)} ms`);
  console.log(`- Standard Deviation: ±${statsNew.stdDev.toFixed(2)} ms`);
  console.log(`- Max RAM Delta (over ${RUNS} runs): ${memUsed2.toFixed(2)} MB\n`);

  console.log(">> CONCLUSION");
  console.log(`Speed Improvement: ${(statsOld.avg / statsNew.avg).toFixed(2)}x Faster`);

  process.exit(0);
}

runBenchmark();
