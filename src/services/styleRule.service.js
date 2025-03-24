// Đánh giá kết hợp họa tiết
static _evaluatePatternMatching(rule, items) {
  const patterns = items.map(item => item.pattern).filter(Boolean);
  
  // Kiểm tra các điều kiện
  const matchingConditions = [];
  let totalScore = 0;
  
  for (const condition of rule.conditions) {
    // Ví dụ: không nên kết hợp quá 2 họa tiết mạnh
    if (condition.attribute === 'patternCount' && condition.operator === 'less_than') {
      const strongPatterns = patterns.filter(pattern => 
        ['plaid', 'floral', 'stripe', 'animal'].includes(pattern)
      );
      
      if (strongPatterns.length < condition.value) {
        matchingConditions.push(condition);
        totalScore += rule.score;
      }
    }
    // Kiểm tra các họa tiết không nên kết hợp với nhau
    else if (condition.attribute === 'incompatiblePatterns' && condition.operator === 'not_equals') {
      const pattern1 = condition.value[0];
      const pattern2 = condition.value[1];
      
      if (!(patterns.includes(pattern1) && patterns.includes(pattern2))) {
        matchingConditions.push(condition);
        totalScore += rule.score;
      }
    }
  }

  if (matchingConditions.length > 0) {
    return {
      ruleId: rule._id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      description: rule.description,
      matchingConditions,
      recommendations: rule.recommendations,
      score: totalScore / matchingConditions.length
    };
  }
  
  return null;
}

// Đánh giá tỷ lệ
static _evaluateProportion(rule, items, userProfile) {
  if (!userProfile) return null;
  
  const matchingConditions = [];
  let totalScore = 0;
  
  // Lấy thông tin về vóc dáng người dùng
  const { bodyType, measurements } = userProfile;
  
  for (const condition of rule.conditions) {
    // Kiểm tra tỷ lệ phần trên/phần dưới (áo/quần)
    if (condition.attribute === 'topBottomRatio' && bodyType) {
      const tops = items.filter(item => ['áo', 'top', 'shirt', 'blouse', 'jacket'].includes(item.category));
      const bottoms = items.filter(item => ['quần', 'váy', 'pants', 'skirt'].includes(item.category));
      
      if (tops.length > 0 && bottoms.length > 0) {
        // Kiểm tra tỷ lệ phù hợp với loại cơ thể
        let isProportionGood = false;
        
        switch (bodyType) {
          case 'hourglass': // Tỷ lệ cân đối
            isProportionGood = true;
            break;
          case 'pear': // Nên nhấn mạnh phần trên
            isProportionGood = tops.some(top => 
              top.attributes && top.attributes.includes('voluminous')
            );
            break;
          case 'apple': // Nên nhấn mạnh phần dưới
            isProportionGood = bottoms.some(bottom => 
              bottom.attributes && bottom.attributes.includes('structured')
            );
            break;
          // Thêm các trường hợp khác
        }
        
        if (isProportionGood) {
          matchingConditions.push(condition);
          totalScore += rule.score;
        }
      }
    }
  }

  if (matchingConditions.length > 0) {
    return {
      ruleId: rule._id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      description: rule.description,
      matchingConditions,
      recommendations: rule.recommendations,
      score: totalScore / matchingConditions.length
    };
  }
  
  return null;
}

// Đánh giá phù hợp với dịp
static _evaluateOccasion(rule, outfit) {
  if (!outfit.occasion) return null;
  
  const matchingConditions = [];
  let totalScore = 0;
  
  for (const condition of rule.conditions) {
    // Kiểm tra dịp
    if (condition.attribute === 'occasion' && condition.operator === 'equals') {
      if (outfit.occasion === condition.value) {
        matchingConditions.push(condition);
        totalScore += rule.score;
      }
    }
    // Kiểm tra độ trang trọng
    else if (condition.attribute === 'formalLevel' && condition.operator === 'equals') {
      const formalOccasions = ['wedding', 'formal', 'business', 'ceremony'];
      const casualOccasions = ['casual', 'daily', 'sport', 'beach'];
      
      const outfitFormalLevel = formalOccasions.includes(outfit.occasion) ? 'formal' : 
                                casualOccasions.includes(outfit.occasion) ? 'casual' : 'semi-formal';
      
      if (outfitFormalLevel === condition.value) {
        matchingConditions.push(condition);
        totalScore += rule.score;
      }
    }
  }

  if (matchingConditions.length > 0) {
    return {
      ruleId: rule._id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      description: rule.description,
      matchingConditions,
      recommendations: rule.recommendations,
      score: totalScore / matchingConditions.length
    };
  }
  
  return null;
}

// Đánh giá phù hợp với dáng người
static _evaluateBodyType(rule, items, userProfile) {
  if (!userProfile || !userProfile.bodyType) return null;
  
  const bodyType = userProfile.bodyType;
  const matchingConditions = [];
  let totalScore = 0;
  
  for (const condition of rule.conditions) {
    // Kiểm tra loại dáng người
    if (condition.attribute === 'bodyType' && condition.operator === 'equals') {
      if (bodyType === condition.value || condition.value === 'all') {
        matchingConditions.push(condition);
        totalScore += rule.score;
      }
    }
    // Kiểm tra các loại trang phục phù hợp cho dáng người
    else if (condition.attribute === 'recommendedStyles' && condition.operator === 'contains') {
      const recommendedStyles = condition.value[bodyType] || [];
      const itemStyles = items.flatMap(item => item.style || []);
      
      const hasRecommendedStyle = recommendedStyles.some(style => itemStyles.includes(style));
      if (hasRecommendedStyle) {
        matchingConditions.push(condition);
        totalScore += rule.score;
      }
    }
  }

  if (matchingConditions.length > 0) {
    return {
      ruleId: rule._id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      description: rule.description,
      matchingConditions,
      recommendations: rule.recommendations,
      score: totalScore / matchingConditions.length
    };
  }
  
  return null;
}

// Đánh giá phù hợp với mùa
static _evaluateSeason(rule, outfit) {
  const currentSeason = this._getCurrentSeason();
  const outfitSeason = outfit.season || currentSeason;
  
  const matchingConditions = [];
  let totalScore = 0;
  
  for (const condition of rule.conditions) {
    // Kiểm tra mùa
    if (condition.attribute === 'season' && condition.operator === 'equals') {
      if (outfitSeason === condition.value || condition.value === 'all' || outfitSeason === 'all') {
        matchingConditions.push(condition);
        totalScore += rule.score;
      }
    }
    // Kiểm tra các chất liệu phù hợp cho mùa
    else if (condition.attribute === 'materials' && condition.operator === 'contains') {
      const seasonalMaterials = condition.value[outfitSeason] || [];
      // Thực hiện kiểm tra tương tự như bodyType
    }
  }

  if (matchingConditions.length > 0) {
    return {
      ruleId: rule._id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      description: rule.description,
      matchingConditions,
      recommendations: rule.recommendations,
      score: totalScore / matchingConditions.length
    };
  }
  
  return null;
}

// Đánh giá các quy tắc chung
static _evaluateGeneral(rule, items, outfit) {
  const matchingConditions = [];
  let totalScore = 0;
  
  for (const condition of rule.conditions) {
    // Kiểm tra số lượng items
    if (condition.attribute === 'itemCount' && condition.operator === 'equals') {
      if (items.length === condition.value) {
        matchingConditions.push(condition);
        totalScore += rule.score;
      }
    }
    // Kiểm tra độ phong phú của tủ đồ
    else if (condition.attribute === 'versatility' && condition.operator === 'greater_than') {
      // Đánh giá dựa trên số lượng outfit có thể tạo ra từ các item
      const versatilityScore = items.reduce((score, item) => {
        return score + (item.wearCount || 0);
      }, 0) / items.length;
      
      if (versatilityScore > condition.value) {
        matchingConditions.push(condition);
        totalScore += rule.score;
      }
    }
  }

  if (matchingConditions.length > 0) {
    return {
      ruleId: rule._id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      description: rule.description,
      matchingConditions,
      recommendations: rule.recommendations,
      score: totalScore / matchingConditions.length
    };
  }
  
  return null;
}

// Xác định mùa hiện tại dựa trên tháng
static _getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter'; // 12, 1, 2
}

module.exports = StyleRuleService; 