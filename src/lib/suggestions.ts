import { CurrentWeather, FoodClothingSuggestion, FarmerAdvisory, Language } from '@/types/weather';

export function getFoodClothingSuggestions(
  current: CurrentWeather,
  lang: Language = 'en'
): FoodClothingSuggestion {
  const { temperature, weather_code, relative_humidity } = current;

  // Rain / Thunderstorm
  if (weather_code >= 51 && weather_code <= 99) {
    if (lang === 'hi') {
      return {
        food: ['गरम-गरम पकोड़े', 'समोसे और चटनी', 'अदरक वाली कड़क चाय', 'गरम सूप'],
        drinks: ['अदरक-तुलसी की चाय', 'गरम मसाला दूध', 'कॉफ़ी'],
        clothing: ['वाटरप्रूफ जैकेट', 'रेनकोट', 'हल्के वाटर-रेसिस्टेंट कपड़े'],
        accessories: ['मज़बूत छाता', 'गमबूट्स / वाटरप्रूफ जूते', 'मोबाइल बैकपैक कवर'],
        reason: 'बारिश और सुहावने नमी वाले मौसम के लिए गरमा-गरम भारतीय व्यंजन और वाटरप्रूफ परिधान!',
      };
    }
    return {
      food: ['Hot Crisp Pakoras', 'Spicy Samosas with Green Chutney', 'Hot Tomato Soup', 'Steaming Maggi'],
      drinks: ['Adrak (Ginger) Masala Tea', 'Hot Filter Coffee', 'Warm Spiced Milk'],
      clothing: ['Waterproof Trench Coat / Raincoat', 'Quick-drying synthetic tops', 'Dark trousers'],
      accessories: ['Sturdy Wind-resistant Umbrella', 'Waterproof Gumboots', 'Rain protection phone cover'],
      reason: 'Rainy and humid weather calls for classic hot Indian comfort food and protective rainwear!',
    };
  }

  // Hot weather (> 30°C)
  if (temperature >= 30) {
    if (lang === 'hi') {
      return {
        food: ['तरबूज और खरबूजा', 'दही-चावल / ताज़ा दही', 'सलाद और खीरा', 'हल्का सुपाच्य भोजन'],
        drinks: ['ठंडी मीठी लस्सी', 'ताज़ा नींबू पानी', 'ताज़ा नारियल पानी', 'आम पन्ना'],
        clothing: ['सूती कपड़े (Cotton attire)', 'हल्के रंग के ढीले कुर्ते / टी-शर्ट', 'लिनन पैंट'],
        accessories: ['यूवी प्रोटेक्टिव धूप का चश्मा (Sunglasses)', 'सनस्क्रीन लोशन (SPF 50+)', 'सूती हैट या सूखा गमछा'],
        reason: 'गर्मी और तेज़ धूप से बचने के लिए शरीर को ठंडा रखने वाले पेय पदार्थ और ढीले सूती कपड़े उपयुक्त हैं।',
      };
    }
    return {
      food: ['Chilled Watermelon & Melon Cubes', 'Curd Rice / Fresh Yogurt', 'Hydrating Cucumber Salad', 'Light South Indian Idli/Sambar'],
      drinks: ['Chilled Sweet Lassi', 'Fresh Nimbu Pani (Lemonade)', 'Natural Tender Coconut Water', 'Aam Panna'],
      clothing: ['Breathable Pure Cotton clothes', 'Light-colored loose shirts/t-shirts', 'Linen trousers'],
      accessories: ['UV Protection Sunglasses', 'Broad Spectrum Sunscreen (SPF 50+)', 'Wide-brimmed Cotton Hat'],
      reason: 'Hot and sunny weather requires cooling hydrating foods, light cotton wear, and solar UV protection!',
    };
  }

  // Cold weather (< 18°C)
  if (temperature <= 18) {
    if (lang === 'hi') {
      return {
        food: ['गरम गाजर का हलवा', 'सरसों का साग और मक्के की रोटी', 'ड्राई फ्रूट्स और गुड़', 'गरम वेजिटेबल सूप'],
        drinks: ['केसर-बादाम दूध', 'गरम ग्रीन टी', 'मसाला चाय', 'हल्दी वाला दूध'],
        clothing: ['ऊन का स्वेटर', 'थर्मल इनरवेयर', 'पैडेड विंटर जैकेट'],
        accessories: ['ऊनी टोपी (Beanie)', 'हाथ के दस्ताने', 'मफलर / स्कार्फ'],
        reason: 'ठंडे मौसम में शरीर को अंदर से गर्म रखने वाले पोषक व्यंजन और गर्म ऊनी कपड़े पहने।',
      };
    }
    return {
      food: ['Hot Gajar Ka Halwa', 'Sarson Ka Saag with Makki Roti', 'Nutritious Jaggery & Dry Fruits', 'Hot Chicken / Lentil Soup'],
      drinks: ['Hot Kesar Badam Milk', 'Spiced Masala Chai', 'Golden Turmeric Latte'],
      clothing: ['Heavy Woolen Sweater', 'Thermal Innerwear set', 'Windproof Down Jacket'],
      accessories: ['Warm Woolen Beanie Cap', 'Insulated Gloves', 'Soft Woolen Muffler'],
      reason: 'Chilly weather calls for energy-dense warming traditional winter delights and layered woolens!',
    };
  }

  // Pleasant Moderate weather (18°C - 29°C)
  if (lang === 'hi') {
    return {
      food: ['ताज़े फल', 'डोसा / उत्तपम', 'ग्रिल्ड सैंडविच', 'हल्की थली'],
      drinks: ['ताज़ा मौसमी फल का जूस', 'कोल्ड कॉफ़ी', 'ताज़ा पानी'],
      clothing: ['कैज़ुअल सूती शर्ट', 'डेनिम / चिनोज़', 'कंफर्टेबल टी-शर्ट'],
      accessories: ['स्मार्टवॉच', 'आरामदायक स्नीकर्स', 'हल्का स्कार्फ'],
      reason: 'सुहावने मौसम का आनंद लें, हल्के और आरामदायक कपड़े पहनें!',
    };
  }

  return {
    food: ['Fresh Fruit Bowl', 'Crispy Dosa / Uttapam', 'Grilled Vegetable Sandwich', 'Light Thali Meal'],
    drinks: ['Fresh Seasonal Fruit Juice', 'Cold Coffee', 'Hydrating Fresh Water'],
    clothing: ['Casual Cotton Shirts / Tops', 'Denim Jeans / Chinos', 'Comfortable T-Shirt'],
    accessories: ['Smartwatch', 'Comfortable Walking Sneakers', 'Light Stylish Scarf'],
    reason: 'Pleasant and balanced weather - enjoy versatile casual outfits and fresh light meals!',
  };
}

export function getFarmerAdvisory(
  current: CurrentWeather,
  dailyPrecipitationSum: number = 0,
  lang: Language = 'en'
): FarmerAdvisory {
  const { temperature, relative_humidity, weather_code } = current;

  let irrigation = 'Normal irrigation schedule recommended.';
  let cropCare = 'Regular weed management and field inspections.';
  let pestRisk = 'Low risk of fungal or insect outbreaks.';
  let alertNote: string | undefined = undefined;

  if (dailyPrecipitationSum > 10 || (weather_code >= 61 && weather_code <= 99)) {
    if (lang === 'hi') {
      irrigation = 'सिंचाई तुरंत स्थगित करें: पर्याप्त वर्षा हो रही है। जल निकासी (Drainage) की व्यवस्था रखें।';
      cropCare = 'खेतों में खड़े पानी को निकालें ताकि जड़ों के सड़ने (Root Rot) से बचाव हो सके।';
      pestRisk = 'उच्च आर्द्रता के कारण फफूंद (Fungal disease) का खतरा। कीटनाशक छिड़काव मौसम साफ़ होने तक टालें।';
      alertNote = 'मूसलाधार बारिश की चेतावनी: कटी हुई फसल को तिरपाल से ढककर सुरक्षित स्थान पर रखें।';
    } else {
      irrigation = 'Postpone irrigation immediately due to significant rainfall. Ensure field drainage.';
      cropCare = 'Clear drainage channels to prevent waterlogging and root damage in low-lying crops.';
      pestRisk = 'High humidity elevates fungal blight risk. Avoid foliar chemical spray during active rains.';
      alertNote = 'Heavy Rainfall Warning: Cover harvested produce with tarpaulin and transfer to shaded godowns.';
    }
  } else if (temperature >= 38) {
    if (lang === 'hi') {
      irrigation = 'हल्की और बार-बार सिंचाई (Light frequent irrigation) शाम या सुबह के समय करें।';
      cropCare = 'मल्चिंग (Mulching) विधि अपनाएं ताकि मिट्टी की नमी संरक्षित रहे।';
      pestRisk = 'तेज़ धूप में थ्रिप्स और सक्शन पेस्ट्स का प्रकोप बढ़ सकता है।';
      alertNote = 'अत्यधिक तापमान: छोटे पौधों और पौधशाला (Nursery) को ग्रीन शेड नेट से ढकें।';
    } else {
      irrigation = 'Apply light, frequent irrigation early morning or late evening to beat heat stress.';
      cropCare = 'Apply soil mulching using crop residue to retain soil moisture and lower soil temp.';
      pestRisk = 'Watch out for sucking pests and red spider mites in dry heat conditions.';
      alertNote = 'Extreme Heat Advisory: Provide shade nets for young nursery saplings and vegetables.';
    }
  } else if (temperature <= 5) {
    if (lang === 'hi') {
      irrigation = 'पाला (Frost) से बचाने के लिए खेत में शाम को हल्की सिंचाई करें।';
      cropCare = 'खेत की मेड़ों पर शाम को धुआं करें ताकि रात का तापमान जमाव बिंदु तक न पहुंचे।';
      pestRisk = 'ठंड के कारण विकास धीमा हो सकता है, सूक्ष्म पोषक तत्वों का छिड़काव करें।';
      alertNote = 'शीतलहर और पाला चेतावनी: रबी फसलों (गेहूं, सरसों, चना) को पाले से बचाएं।';
    } else {
      irrigation = 'Provide light evening irrigation to release latent heat and protect against night frost.';
      cropCare = 'Create light smoke around boundary hedges to insulate fields during freezing nights.';
      pestRisk = 'Growth sluggishness due to cold wave. Apply micronutrient foliar spray when sunny.';
      alertNote = 'Coldwave & Frost Alert: High frost damage risk for mustard, potato, and chickpea crops.';
    }
  } else {
    if (lang === 'hi') {
      irrigation = 'फसल की आवश्यकतानुसार सामान्य सिंचाई करें।';
      cropCare = 'कीट एवं रोग नियंत्रण के लिए नियमित रूप से खेत का निरीक्षण करें।';
      pestRisk = 'कीट का प्रकोप सामान्य सीमा के भीतर है।';
    }
  }

  return {
    irrigation,
    cropCare,
    pestRisk,
    alertNote,
  };
}

export function getDisasterSafetyTips(weatherCode: number, lang: Language = 'en'): string[] {
  if (weatherCode >= 95) {
    // Thunderstorm
    if (lang === 'hi') {
      return [
        'बिजली चमकने के समय खुले मैदान, ऊंचे पेड़ों या लोहे के खंभों के पास बिल्कुल न खड़े हों।',
        'घर के खिड़की-दरवाजे बंद रखें और बिजली के संवेदनशील उपकरणों को प्लग से निकाल दें।',
        'यदि वाहन में हैं, तो खिड़कियाँ बंद करके वाहन के अंदर ही रहें।',
      ];
    }
    return [
      'Do NOT take shelter under isolated tall trees, metal poles, or in open fields during lightning.',
      'Stay indoors with doors/windows closed and unplug sensitive electronics.',
      'If driving, roll up windows and remain inside the metal body of the vehicle.',
    ];
  }

  if (weatherCode >= 65) {
    // Heavy rain / flood risk
    if (lang === 'hi') {
      return [
        'जलमग्न रास्तों और पुलिया को पार करने का प्रयास न करें।',
        'अपने पीने के पानी को उबालकर या फ़िल्टर करके ही पिएं।',
        'आपातकालीन टॉर्च, पावर बैंक और प्राथमिक चिकित्सा किट (First Aid) तैयार रखें।',
      ];
    }
    return [
      'Never drive or walk through flooded underpasses or fast-moving water bodies.',
      'Boil or purify drinking water to prevent waterborne contamination.',
      'Keep emergency flashlights, fully charged power banks, and first-aid kits accessible.',
    ];
  }

  // Default general safety tips
  if (lang === 'hi') {
    return [
      'मौसम विभाग (IMD) की चेतावनियों पर नियमित नज़र रखें।',
      'घर से निकलते समय मौसम के अनुकूल वस्त्र और पानी साथ रखें।',
    ];
  }
  return [
    'Monitor regional meteorological advisories for rapid micro-climate shifts.',
    'Carry emergency hydration and appropriate atmospheric wear when traveling.',
  ];
}
