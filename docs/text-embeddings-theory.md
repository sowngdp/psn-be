# Lý Thuyết về Text Embeddings và Hệ Thống Gợi Ý (Recommendation System)

## 1. Giới Thiệu về Text Embeddings

### Khái Niệm Cơ Bản
Text embeddings là phương pháp chuyển đổi văn bản thành biểu diễn số học dưới dạng vector, cho phép máy tính có thể xử lý và hiểu được ý nghĩa của văn bản. Vector embeddings là các mảng số thực đại diện cho dữ liệu phi số học như từ ngữ hoặc hình ảnh, giúp các mô hình học máy có thể xử lý chúng một cách hiệu quả.

### Giả Thuyết Phân Phối (Distributional Hypothesis)
Khái niệm cơ bản của embeddings dựa trên giả thuyết phân phối, cho rằng các từ hoặc cụm từ xuất hiện trong ngữ cảnh tương tự thường có nghĩa tương tự nhau. Ví dụ, các từ "vua" và "nữ hoàng" mặc dù không phải đồng nghĩa nhưng lại chia sẻ ngữ cảnh tương tự liên quan đến hoàng gia và quân chủ.

## 2. Cơ Sở Toán Học của Vector Embeddings

### Không Gian Vector Đa Chiều
Vector embeddings hoạt động trong không gian vector đa chiều, nơi mỗi từ hoặc văn bản được biểu diễn như một điểm trong không gian này. Tính tương tự ngữ nghĩa giữa hai văn bản được thể hiện thông qua khoảng cách giữa các vector tương ứng trong không gian này.

### Phép Đo Độ Tương Tự

#### Cosine Similarity
Cosine similarity (độ tương tự cosine) là phương pháp phổ biến nhất để đo độ tương tự giữa hai vector embeddings. Công thức tính cosine similarity dựa trên góc giữa hai vector:

```
similarity = cos(θ) = (A · B) / (||A|| × ||B||)
```

Với giá trị từ -1 đến 1:
- **1**: hai vector giống hệt nhau
- **-1**: hai vector đối lập
- **0**: hai vector không liên quan

#### Euclidean Distance
Khoảng cách Euclidean đo khoảng cách thẳng giữa hai điểm trong không gian đa chiều:

```
distance = √(Σ(ai - bi)²)
```

## 3. Kiến Trúc và Công Nghệ

### Mạng Neural và Transformer
Các mô hình embedding hiện đại, đặc biệt là các mô hình của OpenAI, sử dụng kiến trúc transformer để tạo ra embeddings có nhận thức ngữ cảnh. Khác với các phương pháp truyền thống như Word2Vec tạo ra embeddings tĩnh (cố định cho mỗi từ bất kể ngữ cảnh), transformer tạo ra embeddings động thích ứng với các từ xung quanh.

**Ví dụ ngữ cảnh:**
- "ngân hàng" trong "bờ sông" → embedding khác
- "ngân hàng" trong "ngân hàng tiền" → embedding khác

### Mô Hình OpenAI Embeddings
OpenAI cung cấp các mô hình embedding thế hệ thứ ba mạnh mẽ:

#### text-embedding-3-small
- **Kích thước embedding mặc định**: 1536 chiều
- **Chi phí**: giảm 5 lần so với thế hệ trước
- **Hiệu suất**: cải thiện đáng kể trên các benchmark đa ngôn ngữ
- **Kiến trúc**: Transformer encoder tương tự BERT/RoBERTa

#### text-embedding-3-large
- **Kích thước embedding**: 3072 chiều
- **Hiệu suất**: cao hơn text-embedding-3-small
- **Sử dụng**: cho các ứng dụng yêu cầu độ chính xác cao

## 4. Ứng Dụng trong Hệ Thống Gợi Ý

### Nguyên Lý Hoạt Động
Hệ thống gợi ý dựa trên embeddings hoạt động theo các bước:

1. **Vectorization**: Chuyển đổi mô tả item thành vector embeddings
2. **Similarity Calculation**: Tính toán độ tương tự giữa các vector
3. **Ranking**: Sắp xếp items theo độ tương tự
4. **Recommendation**: Đưa ra gợi ý dựa trên ranking

### Ưu Điểm
- **Hiểu ngữ nghĩa**: Không chỉ dựa vào từ khóa chính xác
- **Đa ngôn ngữ**: Hoạt động tốt với nhiều ngôn ngữ
- **Linh hoạt**: Không cần huấn luyện lại cho domain mới
- **Chất lượng**: Kết quả gợi ý chính xác và có ý nghĩa

## 5. Ứng Dụng Cụ Thể trong PSN-BE Project

### 5.1. Outfit Recommendation System

#### Mô Tả Hiện Tại
Trong PSN-BE, outfit recommendation được implement tại:
- `src/services/recommendation.service.js`
- `src/services/recommendation-engine.service.js`
- `src/controllers/recommendation.controller.js`

#### Cải Tiến với Text Embeddings

##### Scenario 1: Style-based Recommendation
```javascript
// Ví dụ: User tìm kiếm "casual summer outfit for work"
const userQuery = "casual summer outfit for work";
const queryEmbedding = await openaiService.createEmbedding(userQuery);

// So sánh với embeddings của outfits có sẵn
const outfits = await getOutfitEmbeddings();
const similarities = outfits.map(outfit => ({
  id: outfit.id,
  similarity: calculateCosineSimilarity(queryEmbedding, outfit.embedding)
}));

// Sắp xếp và trả về top recommendations
return similarities
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, 10);
```

##### Scenario 2: Weather-based Contextual Recommendations
```javascript
// Kết hợp thông tin thời tiết với style preference
const weatherContext = await weatherService.getCurrentWeather();
const stylePreference = user.styleProfile.preferredStyles;

const contextualQuery = `${stylePreference} outfit for ${weatherContext.description} weather, temperature ${weatherContext.temp}°C`;
const contextEmbedding = await openaiService.createEmbedding(contextualQuery);
```

### 5.2. Item Similarity and Discovery

#### Wardrobe Item Matching
```javascript
// Tìm items tương tự trong wardrobe
async function findSimilarItems(targetItem, userWardrobe) {
  const targetDescription = `${targetItem.category} ${targetItem.color} ${targetItem.brand} ${targetItem.style}`;
  const targetEmbedding = await openaiService.createEmbedding(targetDescription);
  
  const similarities = [];
  for (const item of userWardrobe) {
    const itemDescription = `${item.category} ${item.color} ${item.brand} ${item.style}`;
    const itemEmbedding = await openaiService.createEmbedding(itemDescription);
    
    const similarity = calculateCosineSimilarity(targetEmbedding, itemEmbedding);
    similarities.push({ item, similarity });
  }
  
  return similarities
    .filter(s => s.similarity > 0.7) // Threshold for similarity
    .sort((a, b) => b.similarity - a.similarity);
}
```

### 5.3. Chat-based Style Recommendations

#### Integration với AI Chat System
```javascript
// src/services/chat.service.js enhancement
async function generateStyleRecommendations(userMessage, userProfile) {
  // Extract style intent from user message
  const styleIntent = await extractStyleIntent(userMessage);
  
  // Create embedding for style intent
  const intentEmbedding = await openaiService.createEmbedding(styleIntent);
  
  // Find matching outfits/items from database
  const recommendations = await findRecommendationsByEmbedding(
    intentEmbedding, 
    userProfile.preferences
  );
  
  return {
    recommendations,
    explanation: await generateExplanation(styleIntent, recommendations)
  };
}
```

## 6. Implementation Strategy cho PSN-BE

### 6.1. Database Schema Enhancement

#### Embedding Storage
```javascript
// src/db/models/outfit.model.js
const outfitSchema = new mongoose.Schema({
  // ... existing fields
  embedding: {
    type: [Number], // Array of numbers for vector storage
    index: false // Don't index due to high dimensionality
  },
  embeddingVersion: {
    type: String,
    default: 'text-embedding-3-small'
  },
  lastEmbeddingUpdate: {
    type: Date,
    default: Date.now
  }
});

// src/db/models/item.model.js
const itemSchema = new mongoose.Schema({
  // ... existing fields
  embedding: {
    type: [Number],
    index: false
  },
  semanticTags: [{
    type: String,
    index: true // For filtering before similarity calculation
  }]
});
```

### 6.2. Service Layer Architecture

#### Embedding Service
```javascript
// src/services/embedding.service.js
class EmbeddingService {
  async generateItemEmbedding(item) {
    const description = this.buildItemDescription(item);
    return await openaiService.createEmbedding(description);
  }
  
  async generateOutfitEmbedding(outfit) {
    const description = this.buildOutfitDescription(outfit);
    return await openaiService.createEmbedding(description);
  }
  
  buildItemDescription(item) {
    return `${item.category} ${item.color} ${item.brand} ${item.pattern} ${item.material} ${item.style}`.trim();
  }
  
  async batchUpdateEmbeddings(collection, items) {
    const batchSize = 100;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await this.processBatch(collection, batch);
    }
  }
}
```

#### Enhanced Recommendation Service
```javascript
// src/services/recommendation-engine.service.js enhancement
class RecommendationEngine {
  async findSimilarByEmbedding(targetEmbedding, collection, filters = {}) {
    // Pre-filter based on basic criteria
    let candidates = await this.preFilter(collection, filters);
    
    // Calculate similarities
    const similarities = candidates.map(item => ({
      item,
      similarity: this.calculateCosineSimilarity(targetEmbedding, item.embedding)
    }));
    
    return similarities
      .filter(s => s.similarity > this.similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity);
  }
  
  calculateCosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
```

### 6.3. API Endpoints Enhancement

#### Recommendation API
```javascript
// src/api/controllers/recommendation.controller.js
async getSemanticRecommendations(req, res, next) {
  try {
    const { query, type, limit = 10 } = req.body;
    const userId = req.user.userId;
    
    // Generate embedding for user query
    const queryEmbedding = await embeddingService.generateQueryEmbedding(query);
    
    // Get recommendations based on type
    let recommendations;
    switch (type) {
      case 'outfit':
        recommendations = await recommendationEngine.getOutfitRecommendations(
          queryEmbedding, userId, limit
        );
        break;
      case 'item':
        recommendations = await recommendationEngine.getItemRecommendations(
          queryEmbedding, userId, limit
        );
        break;
      default:
        recommendations = await recommendationEngine.getGeneralRecommendations(
          queryEmbedding, userId, limit
        );
    }
    
    return res.status(200).json(
      new SuccessResponse({
        message: 'Semantic recommendations retrieved successfully',
        metadata: {
          query,
          total: recommendations.length,
          recommendations
        }
      })
    );
  } catch (error) {
    next(error);
  }
}
```

## 7. Performance Considerations

### 7.1. Caching Strategy
- **Vector Caching**: Cache embeddings trong Redis
- **Similarity Caching**: Cache kết quả similarity calculations
- **Batch Processing**: Process embeddings theo batch để tối ưu API calls

### 7.2. Optimization Techniques
- **Dimensionality Reduction**: Sử dụng PCA cho embeddings lớn
- **Approximate Nearest Neighbor**: Implement ANN algorithms (FAISS, Annoy)
- **Lazy Loading**: Chỉ tính embedding khi cần thiết

### 7.3. Cost Management
- **Batch API Calls**: Gom nhiều texts vào một API call
- **Caching**: Tránh tính toán lại embeddings cho cùng content
- **Selective Updates**: Chỉ update embeddings khi content thay đổi đáng kể

## 8. Monitoring và Evaluation

### 8.1. Metrics
- **Similarity Distribution**: Phân phối độ tương tự trong kết quả
- **User Engagement**: Click-through rate, time spent
- **Recommendation Accuracy**: A/B testing với traditional methods

### 8.2. Quality Assurance
- **Manual Review**: Review sample recommendations
- **User Feedback**: Thu thập feedback để cải thiện
- **Semantic Coherence**: Đảm bảo recommendations có ý nghĩa

## 9. Roadmap Implementation

### Phase 1: Foundation (2-3 weeks)
- [ ] Setup OpenAI embeddings integration
- [ ] Implement basic embedding service
- [ ] Add embedding fields to database schemas
- [ ] Create similarity calculation utilities

### Phase 2: Core Features (3-4 weeks)
- [ ] Implement outfit recommendation with embeddings
- [ ] Add item similarity search
- [ ] Integrate with existing recommendation system
- [ ] Create batch processing for existing data

### Phase 3: Advanced Features (2-3 weeks)
- [ ] Contextual recommendations (weather, occasion)
- [ ] Chat-based semantic search
- [ ] Performance optimization
- [ ] Monitoring and analytics

### Phase 4: Optimization (1-2 weeks)
- [ ] A/B testing setup
- [ ] Performance tuning
- [ ] Cost optimization
- [ ] Documentation and training

## 10. Conclusion

Text embeddings mang lại khả năng hiểu ngữ nghĩa sâu sắc cho hệ thống gợi ý của PSN-BE, cho phép:

- **Gợi ý chính xác hơn** dựa trên ý nghĩa thực sự thay vì chỉ keyword matching
- **Trải nghiệm người dùng tốt hơn** với khả năng tìm kiếm tự nhiên
- **Khả năng mở rộng** cho các tính năng AI/ML tương lai
- **Tích hợp mượt mà** với hệ thống chat AI hiện có

Việc implementation từng bước sẽ đảm bảo hệ thống ổn định và có thể đo lường được hiệu quả của từng cải tiến. 