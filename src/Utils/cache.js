'use strict';

/**
 * Module caching đơn giản sử dụng in-memory để lưu trữ metadata
 * và dữ liệu tĩnh thường được truy cập.
 */

// Cache store
const cacheStore = new Map();

// Thời gian mặc định cho cache (15 phút)
const DEFAULT_TTL = 15 * 60 * 1000;

/**
 * Lưu giá trị vào cache
 * @param {string} key - Cache key
 * @param {any} value - Giá trị cần lưu
 * @param {number} ttl - Thời gian tồn tại (ms)
 */
const set = (key, value, ttl = DEFAULT_TTL) => {
  const expiresAt = Date.now() + ttl;
  cacheStore.set(key, {
    value,
    expiresAt
  });
};

/**
 * Lấy giá trị từ cache
 * @param {string} key - Cache key
 * @returns {any|null} Giá trị hoặc null nếu không tìm thấy hoặc hết hạn
 */
const get = (key) => {
  const item = cacheStore.get(key);
  
  // Cache miss
  if (!item) return null;
  
  // Đã hết hạn
  if (item.expiresAt < Date.now()) {
    cacheStore.delete(key);
    return null;
  }
  
  return item.value;
};

/**
 * Xóa một key khỏi cache
 * @param {string} key - Cache key
 */
const del = (key) => {
  cacheStore.delete(key);
};

/**
 * Xóa toàn bộ cache
 */
const clear = () => {
  cacheStore.clear();
};

/**
 * Lấy danh sách tất cả các keys trong cache
 * @returns {Set<string>} Set chứa tất cả các keys
 */
const getKeys = () => {
  return cacheStore.keys();
};

/**
 * Lấy giá trị từ cache hoặc chạy hàm để tạo giá trị mới
 * @param {string} key - Cache key
 * @param {Function} fetcher - Hàm lấy dữ liệu nếu cache miss
 * @param {number} ttl - Thời gian tồn tại (ms)
 * @returns {Promise<any>} Giá trị từ cache hoặc từ hàm fetcher
 */
const getOrSet = async (key, fetcher, ttl = DEFAULT_TTL) => {
  const cachedValue = get(key);
  if (cachedValue !== null) {
    return cachedValue;
  }
  
  const value = await fetcher();
  set(key, value, ttl);
  return value;
};

// Dọn dẹp cache hết hạn định kỳ (mỗi 30 phút)
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of cacheStore.entries()) {
    if (item.expiresAt < now) {
      cacheStore.delete(key);
    }
  }
}, 30 * 60 * 1000);

module.exports = {
  set,
  get,
  del,
  clear,
  getOrSet,
  getKeys
}; 