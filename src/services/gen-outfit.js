const recommendationModel = require("../db/models/recommendation.model");
const itemModel = require("../db/models/item.model");
const { generateText } = require("ai");
const { LLM_REGISTRY } = require("../utils/llm-registry");
const { composeImagesUseLLM } = require("./image.service");
const firebaseService = require("./firebase.service");
const { embedMany } = require("ai");
const {getDaNangWeatherEmbed} = require("../utils/constants/wmo")

function cosineSimilarity(vecA, vecB) {
	const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
	const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
	const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
	return dotProduct / (magA * magB);
}

async function generateOutfitRecommendation(userId) {
	try {
		// if userId is have recommendation then
		const existingRecommendation = await recommendationModel.findOne({
			userId,
			type: "ai_suggestion",
			status: "completed",
		});
		if (existingRecommendation) {
			console.warn(
				`User ${userId} already has a completed recommendation. Skipping...`
			);
			return;
		}
		const userItems = (
			await itemModel.find({ ownerId: userId }).lean()
		).filter((item) => item.embedding && item.category && item.embedText);
		const topItems = userItems.filter((item) => item.category === "top");
		const bottomItems = userItems.filter(
			(item) => item.category === "bottom"
		);
		if (!topItems.length || !bottomItems.length) return;

		for (const top of topItems) {
			let bestMatch = null;
			let bestScore = -1;
			for (const bottom of bottomItems) {
				const similarity = cosineSimilarity(
					top.embedding,
					bottom.embedding
				);
				if (similarity > bestScore) {
					bestScore = similarity;
					bestMatch = bottom;
				}
			}
			if (!bestMatch) continue;

			// Generate natural outfit description
			let text = "";
			try {
				const prompt = `
                Dưới đây là mô tả chi tiết các item trong một bộ outfit. Hãy viết lại thành một đoạn mô tả tổng thể tự nhiên, giới thiệu outfit này, nhấn mạnh phong cách, chất liệu, màu sắc và sự phối hợp giữa các item. Không liệt kê từng món, hãy diễn đạt như một stylist mô tả trang phục.
                Các item:
                - ${top.embedText}
                - ${bestMatch.embedText}
                Kết quả mong muốn: Một đoạn mô tả liền mạch, giàu hình ảnh, tự nhiên (không gạch đầu dòng), nêu bật tổng thể outfit.
        `;
				const result = await generateText({
					model: LLM_REGISTRY.languageModel(
						"google.gemini-2.0-flash"
					),
					prompt,
				});
				text = result.text ;
			} catch (err) {
				console.error("LLM failed:", err);
				text = `${top.embedText} + ${bestMatch.embedText}`;
			}

			// Save to DB
            console.log("Saving recommendation to DB...",text);
            if (!text) {
                process.exit(1);
            }
			try {
				await recommendationModel.create({
					userId,
					type: "ai_suggestion",
					context: {
						topItemId: top._id,
						bottomItemId: bestMatch._id,
					},
					status: "completed",
					recommendedOutfits: [
						{
							outfitId: null,
							score: bestScore,
							reason: `Best match for ${top.name} is ${bestMatch.name} with score ${bestScore}`,
						},
					],
					suggestedItems: [
						{
							itemId: top._id,
							reason: `Suggested top item: ${top.name}`,
						},
						{
							itemId: bestMatch._id,
							reason: `Suggested bottom item: ${bestMatch.name}`,
						},
					],
					embedText: text,
					embedding: null, // gen embedding sau nếu muốn
				});
			} catch (err) {
				console.error("DB save failed:", err);
			}
            console.log(
                `Generated recommendation for user ${userId}: ${top.name} + ${bestMatch.name}`
            );
            await new Promise(resolve => setTimeout(resolve, 15000)); // Giới hạn tốc độ
		}
	} catch (err) {
		console.error("Recommendation generation failed:", err);
	}
}
async function generateImageForAllRecommendations() {
    const recommendationDontHaveImage = await recommendationModel
        .find({ imageUrl: { $exists: false }, status: "completed" })
        .select({ embedding: 0 }) // loại bỏ field embedding
        .lean();
    for (const recommendation of recommendationDontHaveImage) {
        try {
            const items = await itemModel
                .find({
                    _id: {
                        $in: recommendation.suggestedItems.map(
                            (item) => item.itemId
                        ),
                    },
                })
                .lean();
            if (items.length === 0) continue;

            let imageUrl = await composeImagesUseLLM(items);
            if (!imageUrl) {
                console.error(
                    `Failed to compose image for recommendation ${recommendation._id}`
                );
                continue;
            }
            imageUrl = await firebaseService.uploadFromLocalPath(imageUrl,'image/png');
            if (!imageUrl) continue;

            recommendation.imageUrl = imageUrl;
            await recommendationModel.updateOne(
                { _id: recommendation._id },
                { $set: { imageUrl } }
            );
            console.log(`Updated recommendation ${recommendation._id} with image`);
            await new Promise(resolve => setTimeout(resolve, 15000)); // Giới hạn tốc độ
        } catch (err) {
            console.error("Failed to generate image for recommendation:", err);
        }
    }
}
// async function getAllUserRecommendations(userId) {
//     // get recommendations and join with items to get item details
//     const recommendations = await recommendationModel
//         .find({ userId, status: "completed" })
//         .select({ embedding: 0 }) 
//         .populate("suggestedItems.itemId", "name imageUrl category")
//         .lean();
	
// 	return recommendations
// }
async function getAllUserRecommendations(userId) {
    // Lấy các embedding reference cho từng loại
    const [weatherEmbed, workEmbed, playEmbed] = await getDaNangWeatherEmbed();

    // Lấy tất cả recommendation có embedding
    const recommendations = await recommendationModel
        .find({
            userId,
            embedding: { $exists: true, $ne: null, $not: { $size: 0 } },
        })
        .select({ embedding: 1, suggestedItems: 1 ,embedText: 1, imageUrl: 1, type: 1, status: 1})
        .populate("suggestedItems.itemId", "name imageUrl category")
        .lean();

    if (!recommendations || recommendations.length === 0) {
        console.warn(`No recommendations found for user ${userId}`);
        return [];
    }

    // Hàm xử lý lọc và sắp xếp theo similarity
    function filterAndSortBySimilarity(embedRef) {
        return recommendations
            .map(rec => ({
                ...rec,
                similarity: cosineSimilarity(rec.embedding, embedRef),
            }))
            .filter(rec => rec.similarity > 0.7)
            .sort((a, b) => b.similarity - a.similarity)
            .map(({ embedding, ...rec }) => rec); // loại bỏ embedding
    }

    // Có thể tắt log hoặc chuyển sang log.debug nếu muốn gỡ lỗi
    // Nếu vẫn muốn log detail, thì lặp qua từng loại bên dưới

    return {
        weather: filterAndSortBySimilarity(weatherEmbed),
        work: filterAndSortBySimilarity(workEmbed),
        play: filterAndSortBySimilarity(playEmbed),
    };
}

async function genEmbeddingForAllRecommendations() {
	const recommendations = await recommendationModel
		.find({ 
			$or: [
				{ embedding: { $exists: false } },
				{ embedding: null },
				{ embedding: [] }
			],
			status: "completed" 
		})
		.select({ embedText: 1, _id: 1 })
		.lean();
	for (const recommendation of recommendations) {
		try {
			if (!recommendation.embedText) {
				console.warn(
					`Recommendation ${recommendation._id} has no embedText, skipping...`
				);
				continue;
			}
			const {embeddings} = await embedMany({
				model: LLM_REGISTRY.textEmbeddingModel(
					"mistral.mistral-embed"
				),
				values: [recommendation.embedText],
			});
			if (!embeddings) continue;

			await recommendationModel.updateOne(
				{ _id: recommendation._id },
				{ $set: { embedding: embeddings[0] } }
			);
			console.log(`Updated recommendation ${recommendation._id} with embedding`);
		} catch (err) {
			console.error("Failed to generate embedding for recommendation:", err);
		}															
	}
}																					

module.exports = {
    generateOutfitRecommendation,

    // Hàm này có thể được gọi từ cron job hoặc khi có item mới
    async generateForAllUsers() {
        try {
            const users = await itemModel.distinct("ownerId");
            for (const userId of users) {
                await this.generateOutfitRecommendation(userId);
            }
        } catch (err) {
            console.error("Failed to generate recommendations for all users:", err);
        }
    },
    generateImageForAllRecommendations,
    getAllUserRecommendations,
	// getAllUserRecommendationsByWeather,
	genEmbeddingForAllRecommendations
};