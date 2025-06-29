const LLM_REGISTRY = require("../llm-registry").LLM_REGISTRY;
//                 - ${bestMatch.embedText}
const fetch = require("node-fetch");
const WMO = {
	0: {
		day: {
			description: "Sunny",
			image: "http://openweathermap.org/img/wn/01d@2x.png",
		},
		night: {
			description: "Clear",
			image: "http://openweathermap.org/img/wn/01n@2x.png",
		},
	},
	1: {
		day: {
			description: "Mainly Sunny",
			image: "http://openweathermap.org/img/wn/01d@2x.png",
		},
		night: {
			description: "Mainly Clear",
			image: "http://openweathermap.org/img/wn/01n@2x.png",
		},
	},
	2: {
		day: {
			description: "Partly Cloudy",
			image: "http://openweathermap.org/img/wn/02d@2x.png",
		},
		night: {
			description: "Partly Cloudy",
			image: "http://openweathermap.org/img/wn/02n@2x.png",
		},
	},
	3: {
		day: {
			description: "Cloudy",
			image: "http://openweathermap.org/img/wn/03d@2x.png",
		},
		night: {
			description: "Cloudy",
			image: "http://openweathermap.org/img/wn/03n@2x.png",
		},
	},
	45: {
		day: {
			description: "Foggy",
			image: "http://openweathermap.org/img/wn/50d@2x.png",
		},
		night: {
			description: "Foggy",
			image: "http://openweathermap.org/img/wn/50n@2x.png",
		},
	},
	48: {
		day: {
			description: "Rime Fog",
			image: "http://openweathermap.org/img/wn/50d@2x.png",
		},
		night: {
			description: "Rime Fog",
			image: "http://openweathermap.org/img/wn/50n@2x.png",
		},
	},
	51: {
		day: {
			description: "Light Drizzle",
			image: "http://openweathermap.org/img/wn/09d@2x.png",
		},
		night: {
			description: "Light Drizzle",
			image: "http://openweathermap.org/img/wn/09n@2x.png",
		},
	},
	53: {
		day: {
			description: "Drizzle",
			image: "http://openweathermap.org/img/wn/09d@2x.png",
		},
		night: {
			description: "Drizzle",
			image: "http://openweathermap.org/img/wn/09n@2x.png",
		},
	},
	55: {
		day: {
			description: "Heavy Drizzle",
			image: "http://openweathermap.org/img/wn/09d@2x.png",
		},
		night: {
			description: "Heavy Drizzle",
			image: "http://openweathermap.org/img/wn/09n@2x.png",
		},
	},
	56: {
		day: {
			description: "Light Freezing Drizzle",
			image: "http://openweathermap.org/img/wn/09d@2x.png",
		},
		night: {
			description: "Light Freezing Drizzle",
			image: "http://openweathermap.org/img/wn/09n@2x.png",
		},
	},
	57: {
		day: {
			description: "Freezing Drizzle",
			image: "http://openweathermap.org/img/wn/09d@2x.png",
		},
		night: {
			description: "Freezing Drizzle",
			image: "http://openweathermap.org/img/wn/09n@2x.png",
		},
	},
	61: {
		day: {
			description: "Light Rain",
			image: "http://openweathermap.org/img/wn/10d@2x.png",
		},
		night: {
			description: "Light Rain",
			image: "http://openweathermap.org/img/wn/10n@2x.png",
		},
	},
	63: {
		day: {
			description: "Rain",
			image: "http://openweathermap.org/img/wn/10d@2x.png",
		},
		night: {
			description: "Rain",
			image: "http://openweathermap.org/img/wn/10n@2x.png",
		},
	},
	65: {
		day: {
			description: "Heavy Rain",
			image: "http://openweathermap.org/img/wn/10d@2x.png",
		},
		night: {
			description: "Heavy Rain",
			image: "http://openweathermap.org/img/wn/10n@2x.png",
		},
	},
	66: {
		day: {
			description: "Light Freezing Rain",
			image: "http://openweathermap.org/img/wn/10d@2x.png",
		},
		night: {
			description: "Light Freezing Rain",
			image: "http://openweathermap.org/img/wn/10n@2x.png",
		},
	},
	67: {
		day: {
			description: "Freezing Rain",
			image: "http://openweathermap.org/img/wn/10d@2x.png",
		},
		night: {
			description: "Freezing Rain",
			image: "http://openweathermap.org/img/wn/10n@2x.png",
		},
	},
	71: {
		day: {
			description: "Light Snow",
			image: "http://openweathermap.org/img/wn/13d@2x.png",
		},
		night: {
			description: "Light Snow",
			image: "http://openweathermap.org/img/wn/13n@2x.png",
		},
	},
	73: {
		day: {
			description: "Snow",
			image: "http://openweathermap.org/img/wn/13d@2x.png",
		},
		night: {
			description: "Snow",
			image: "http://openweathermap.org/img/wn/13n@2x.png",
		},
	},
	75: {
		day: {
			description: "Heavy Snow",
			image: "http://openweathermap.org/img/wn/13d@2x.png",
		},
		night: {
			description: "Heavy Snow",
			image: "http://openweathermap.org/img/wn/13n@2x.png",
		},
	},
	77: {
		day: {
			description: "Snow Grains",
			image: "http://openweathermap.org/img/wn/13d@2x.png",
		},
		night: {
			description: "Snow Grains",
			image: "http://openweathermap.org/img/wn/13n@2x.png",
		},
	},
	80: {
		day: {
			description: "Light Showers",
			image: "http://openweathermap.org/img/wn/09d@2x.png",
		},
		night: {
			description: "Light Showers",
			image: "http://openweathermap.org/img/wn/09n@2x.png",
		},
	},
	81: {
		day: {
			description: "Showers",
			image: "http://openweathermap.org/img/wn/09d@2x.png",
		},
		night: {
			description: "Showers",
			image: "http://openweathermap.org/img/wn/09n@2x.png",
		},
	},
	82: {
		day: {
			description: "Heavy Showers",
			image: "http://openweathermap.org/img/wn/09d@2x.png",
		},
		night: {
			description: "Heavy Showers",
			image: "http://openweathermap.org/img/wn/09n@2x.png",
		},
	},
	85: {
		day: {
			description: "Light Snow Showers",
			image: "http://openweathermap.org/img/wn/13d@2x.png",
		},
		night: {
			description: "Light Snow Showers",
			image: "http://openweathermap.org/img/wn/13n@2x.png",
		},
	},
	86: {
		day: {
			description: "Snow Showers",
			image: "http://openweathermap.org/img/wn/13d@2x.png",
		},
		night: {
			description: "Snow Showers",
			image: "http://openweathermap.org/img/wn/13n@2x.png",
		},
	},
	95: {
		day: {
			description: "Thunderstorm",
			image: "http://openweathermap.org/img/wn/11d@2x.png",
		},
		night: {
			description: "Thunderstorm",
			image: "http://openweathermap.org/img/wn/11n@2x.png",
		},
	},
	96: {
		day: {
			description: "Light Thunderstorms With Hail",
			image: "http://openweathermap.org/img/wn/11d@2x.png",
		},
		night: {
			description: "Light Thunderstorms With Hail",
			image: "http://openweathermap.org/img/wn/11n@2x.png",
		},
	},
	99: {
		day: {
			description: "Thunderstorm With Hail",
			image: "http://openweathermap.org/img/wn/11d@2x.png",
		},
		night: {
			description: "Thunderstorm With Hail",
			image: "http://openweathermap.org/img/wn/11n@2x.png",
		},
	},
};
const z = require("zod");
const responseSchema = z.object({
	text: z.string(),
});
const prompt = `
Bạn là một hệ thống chuyển đổi dữ liệu thời tiết thành mô tả ngắn gọn, dễ hiểu bằng tiếng Việt. Hãy mô tả thời tiết dựa trên các thông tin sau (dưới dạng JSON). Hãy viết từ 1 đến 2 câu mô tả bao gồm:

Thời gian trong ngày (sáng, trưa, chiều, tối, đêm).

Tình trạng thời tiết (trời quang, mưa nhẹ, nhiều mây,...).

Nhiệt độ (lạnh, mát, ấm, nóng... tùy ngữ cảnh).

Gió (nếu đáng chú ý).

Trả về duy nhất văn bản mô tả, không kèm bất kỳ giải thích nào.

for example, input:
json
Chỉnh sửa
{
  "time": "2025-06-18T01:00",
  "temperature": 27.1,
  "windspeed": 2.8,
  "winddirection": 220,
  "is_day": 0,
  "weathercode": 3
  description": "Cloudy"
}
📝 Output mẫu mong đợi:
{
    "text": "Đêm nay trời nhiều mây, nhiệt độ khoảng 27 độ C với gió nhẹ"
}

Now convert this input:
`;
const { generateObject } = require("ai");
const { embedMany } = require("ai");

async function genTextFromCurrentWeather(currentWeather) {
	const { object } = await generateObject({
		model: LLM_REGISTRY.languageModel("google.gemini-2.0-flash"),
		prompt: `${prompt}${JSON.stringify(currentWeather)}`,
		schema: responseSchema,
	});
	return object.text;
}
async function genEmbeddingFromCurrentWeather(currentWeather) {
    const text = await genTextFromCurrentWeather(currentWeather);
	if (!text) {
		throw new Error("Generated text is empty");
	}
	const { embeddings } = await embedMany({
		model: LLM_REGISTRY.textEmbeddingModel("mistral.mistral-embed"),
		values: [text,"Quần áo lịch thiệp, tôn trọng môi trường chuyên nghiệp", "Trang phục thoải mái, phù hợp đi chơi cuối tuần."],
	});
	return embeddings
}
var GLOBAL_CACHE = {};
async function getDaNangWeatherEmbed() {
	const currentHour = new Date().getHours();
	if (GLOBAL_CACHE[currentHour]) {
		return GLOBAL_CACHE[currentHour];
	}
	const lat = 16.047079;
	const lon = 108.20623;
	const url =
		`https://api.open-meteo.com/v1/forecast` +
		`?latitude=${lat}&longitude=${lon}` +
		`&current_weather=true` +
		`&hourly=temperature_2m,precipitation` +
		`&timezone=Asia%2FHo_Chi_Minh&current=weather_code`;

	const res = await fetch(url);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const data = await res.json();
	const weather_code = data.current_weather.weathercode;
	if (WMO[weather_code + ""]) {
		data.current_weather.description = WMO[weather_code].day.description;
	}
	console.log(data.current_weather);

	const text = await genEmbeddingFromCurrentWeather(data.current_weather);
	GLOBAL_CACHE[currentHour] = text;
	return text;
}
module.exports = {
	WMO: WMO,
	getDaNangWeatherEmbed: getDaNangWeatherEmbed,
};
