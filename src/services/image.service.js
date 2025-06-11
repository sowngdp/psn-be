const axios = require("axios");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const { z } = require("zod");
const { generateObject } = require("ai");
const { LLM_REGISTRY } = require("../utils/llm-registry");

async function getImageInput(imageUrl) {
	if (/^https?:\/\//.test(imageUrl)) {
		const res = await axios.get(imageUrl, { responseType: "arraybuffer" });
		return Buffer.from(res.data);
	} else {
		return imageUrl;
	}
}

async function composeImages(
	imageList,
	canvasWidth = null,
	canvasHeight = null
) {
	const imageInputs = await Promise.all(
		imageList.map((item) => getImageInput(item.imageUrl))
	);

	// === Resize tất cả ảnh về 300px (giữ tỷ lệ) ===
	const resizedImages = await Promise.all(
		imageInputs.map((input) =>
			sharp(input)
				.resize(300, 300, {
					fit: "inside", // giữ tỷ lệ, không crop
					withoutEnlargement: false, // cho phép phóng to nếu ảnh nhỏ hơn 300px
				})
				.toBuffer()
		)
	);

	// Lấy metadata từ ảnh đã resize
	const metadatas = await Promise.all(
		resizedImages.map((buffer) => sharp(buffer).metadata())
	);

	const width = canvasWidth || Math.max(...metadatas.map((m) => m.width));
	const height = canvasHeight || Math.max(...metadatas.map((m) => m.height));

	const base = sharp({
		create: {
			width,
			height,
			channels: 3,
			background: { r: 255, g: 255, b: 255 },
		},
	});

	function calcPosition(
		position,
		imgWidth,
		imgHeight,
		canvasWidth,
		canvasHeight
	) {
		let left = 0,
			top = 0;
		switch (position) {
			case "top-left":
				left = 0;
				top = 0;
				break;
			case "top-center":
				left = Math.floor((canvasWidth - imgWidth) / 2);
				top = 0;
				break;
			case "top-right":
				left = canvasWidth - imgWidth;
				top = 0;
				break;
			case "middle-left":
				left = 0;
				top = Math.floor((canvasHeight - imgHeight) / 2);
				break;
			case "middle-center":
				left = Math.floor((canvasWidth - imgWidth) / 2);
				top = Math.floor((canvasHeight - imgHeight) / 2);
				break;
			case "middle-right":
				left = canvasWidth - imgWidth;
				top = Math.floor((canvasHeight - imgHeight) / 2);
				break;
			case "bottom-left":
				left = 0;
				top = canvasHeight - imgHeight;
				break;
			case "bottom-center":
				left = Math.floor((canvasWidth - imgWidth) / 2);
				top = canvasHeight - imgHeight;
				break;
			case "bottom-right":
				left = canvasWidth - imgWidth;
				top = canvasHeight - imgHeight;
				break;
			default:
				left = 0;
				top = 0;
		}
		return { left, top };
	}

	const compositeList = imageList.map((item, i) => {
		const pos = calcPosition(
			item.positions,
			metadatas[i].width,
			metadatas[i].height,
			width,
			height
		);
		return {
			input: resizedImages[i], // sử dụng ảnh đã resize
			left: pos.left,
			top: pos.top,
		};
	});

	// === Tạo tên file random và full path trong tmp dir ===
	const tmpDir = os.tmpdir();
	const fileName = `${uuidv4()}.png`;
	const outputPath = path.join(tmpDir, fileName);

	await base
		.composite(compositeList)
		.trim({
			background: "#ffffff", // Màu nền cần loại bỏ
			threshold: 10, // Độ nhạy (0-100)
		})
		.png() // Chuyển đổi sang định dạng PNG
		.toFile(outputPath);
	if (fs.existsSync(outputPath)) {
		console.log("Image composition completed successfully:", outputPath);
		return outputPath;
	} else {
		throw new Error("Failed to create image file");
	}
}

const prompt = `Tôi có một canvas ảnh 1000x1000px.
			Dưới đây là danh sách các item thời trang với mô tả.
			Hãy trả về danh sách JSON gồm các object ứng với từng item theo thứ tự đầu vào, mỗi object chứa:

			"x": tọa độ x (trung tâm item trên canvas, đơn vị pixel)

			"y": tọa độ y (trung tâm item)

			"size": kích thước (chiều rộng và chiều cao, mặc định là hình vuông, đơn vị pixel)

			Mục tiêu là tạo bố cục ảnh outfit flat lay trông hài hòa, giống như người mặc.
			Size các item sao cho vừa với canvas 1000x1000px, không bị thừa, fit với canvas.
			Các item nên được đặt theo thứ tự tự nhiên từ trên xuống dưới: mũ/phụ kiện đầu → áo → quần → giày. Túi và phụ kiện khác có thể đặt lệch hai bên.
`;
const responseSchema = z
	.array(
		z.object({
			id: z.string().describe("ID của item"),
			x: z
				.number()
				.describe(
					"tọa độ x (trung tâm item trên canvas, đơn vị pixel)"
				),
			y: z.number().describe("tọa độ y (trung tâm item)"),
			size: z
				.number()
				.describe(
					"kích thước (chiều rộng và chiều cao, hình vuông, đơn vị pixel)"
				),
		})
	)
	.describe("Một mảng các object ứng với từng item đã được sắp xếp hợp lý");
async function composeImagesUseLLM(items) {
	const input = items.map((item) => {
		return {
			id: item._id.toString(),
			category: item.subCategory || item.name,
		};
	});
	const { object } = await generateObject({
		model: LLM_REGISTRY.languageModel("google.gemini-2.0-flash"),
		prompt: prompt + ` Các item: ${JSON.stringify(input)}`,
		schema: responseSchema,
	});
	const imageInputs = await Promise.all(
		items.map((item) => getImageInput(item.imageUrl)) // list buffer or local file path
	);
	const objectMap = Object.fromEntries(object.map((o) => [o.id, o]));

	const composed = items.map((item, index) => ({
		...item,
		position: objectMap[item._id.toString()],
		image: imageInputs[index],
	}));

	const base = sharp({
		create: {
			width: 1000,
			height: 1000,
			channels: 4,
			background: { r: 255, g: 255, b: 255, alpha: 1 }, // white background
		},
	});

	const composites = await Promise.all(
		composed.map(async (item) => {
			const { x, y, size } = item.position;
			const left = Math.round(x - size / 2);
			const top = Math.round(y - size / 2);

			const resized = await sharp(item.image)
				.resize(size, size)
				.toBuffer();

			return {
				input: resized,
				top,
				left,
			};
		})
	);
	const filePath = path.join(os.tmpdir(), `${uuidv4()}.png`);
	const finalImage = await base.composite(composites).png().toFile(filePath);
	return finalImage ? filePath : null;
}

module.exports = {
	composeImages:composeImagesUseLLM, // Expose the function as composeImages
	composeImagesUseLLM,
};
