"use strict";

const KeyStoreService = require("../services/key-store.service");

// Cấu hình JWT mặc định
let jwtConfig = {
	keys: {
		private: null,
		public: null,
	},
	access: {
		expiration: /** @type {any} */ (process.env.JWT_EXPIRATION || "1h"),
		algorithm: /** @type {any} */ ("RS256"),
	},
	refresh: {
		expiration: /** @type {any} */ (
			process.env.JWT_REFRESH_EXPIRATION || "7d"
		),
		algorithm: /** @type {any} */ ("RS256"),
	},
	issuer: process.env.JWT_ISSUER || "psn-api",
	isInitialized: false,
};

/**
 * Khởi tạo cấu hình JWT
 * @returns {Promise<Object>} - Cấu hình JWT
 */
const initJwtConfig = async () => {
	if (jwtConfig.isInitialized) {
		return jwtConfig;
	}

	try {
		// Lấy hoặc tạo cặp khóa RSA từ database
		const { private: privateKey, public: publicKey } =
			await KeyStoreService.getOrCreateRSAKeys();

		jwtConfig.keys = {
			private: privateKey,
			public: publicKey,
		};

		jwtConfig.isInitialized = true;
		console.log(
			"JWT configuration initialized with RSA keys from database"
		);

		return jwtConfig;
	} catch (error) {
		console.error("Failed to initialize JWT config:", error);
		throw error;
	}
};

// Export cả hai - để có thể gọi async init và truy cập cấu hình sau khi init
module.exports = {
	config: jwtConfig,
	init: initJwtConfig,
};
