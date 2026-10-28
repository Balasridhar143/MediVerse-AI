/**
 * verifiedMedicineDatabase.js
 * Verified Clinical Reference Data for Patient-Facing Medicine Information.
 * 
 * Safety & Clinical Accuracy Constraints:
 * - Factual clinical indications, side effects, severity classification, warnings, and missed dose rules.
 * - Categorized side effects: Common (monitor), Important (contact doctor), Emergency (immediate care).
 * - Easy-language explanations provided alongside standard medical terms.
 * - Tamil translations preserving clinical accuracy.
 * - No invented drug actions or universal missed-dose claims.
 */

export const verifiedMedicineDatabase = {
  med_1: {
    id: 'med_1',
    name: 'Telmisartan',
    brandNames: ['Micardis', 'Telma', 'Telpres'],
    drugClass: 'Angiotensin II Receptor Blocker (ARB)',
    drugClassEasy: 'Blood pressure medicine that relaxes blood vessels',
    purpose: 'Used to treat high blood pressure (hypertension) and protect the heart and kidneys.',
    purposeTamil: 'உயர் இரத்த அழுத்தத்தைக் கட்டுப்படுத்தவும் இதயத்தைப் பாதுகாக்கவும் பயன்படுகிறது.',
    
    // Clinical guidance on how to take
    howToTake: 'Swallow the tablet whole with a glass of water. It can be taken with or after food. Try to take it at the same scheduled time every day.',
    howToTakeTamil: 'ஒரு டம்ளர் தண்ணீருடன் முழு மாத்திரையையும் விழுங்கவும். தினமும் ஒரே நேரத்தில் எடுத்துக்கொள்ளவும்.',
    
    // Categorized Side Effects
    sideEffects: {
      common: [
        {
          name: 'Dizziness or lightheadedness',
          easyExplanation: 'Feeling slightly unsteady, especially when standing up quickly',
          tamil: 'தலைச்சுற்றல் அல்லது லேசான மயக்கம்',
          guidance: 'Rise slowly from sitting or lying positions. Inform your doctor if persistent.',
        },
        {
          name: 'Sinus congestion / cold symptoms',
          easyExplanation: 'Mild runny or stuffy nose',
          tamil: 'லேசான சளி அல்லது மூக்கடைப்பு',
          guidance: 'Mild and typically resolves. Mention to your clinician during review.',
        },
        {
          name: 'Back pain or fatigue',
          easyExplanation: 'Feeling tired or mild muscle ache in the back',
          tamil: 'உடல் சோர்வு அல்லது முதுகு வலி',
          guidance: 'Monitor and inform your doctor if it limits daily activity.',
        },
      ],
      important: [
        {
          name: 'Persistent severe dizziness or fainting',
          easyExplanation: 'Blood pressure dropping excessively low (hypotension)',
          tamil: 'அதிக தலைச்சுற்றல் அல்லது மயக்கம் ஏற்படுதல்',
          guidance: 'Sit down immediately. Contact your prescribing doctor promptly.',
        },
        {
          name: 'Swelling of feet, ankles, or lower legs (peripheral edema)',
          easyExplanation: 'Fluid buildup in lower legs',
          tamil: 'பாதங்கள் அல்லது கணுக்காலில் வீக்கம் ஏற்படுதல்',
          guidance: 'Contact your doctor for dose adjustment. Do not stop medicine abruptly.',
        },
        {
          name: 'Decreased urination or changes in kidney function',
          easyExplanation: 'Producing noticeably less urine than usual',
          tamil: 'சிறுநீர் வெளியேறும் அளவு குறைதல்',
          guidance: 'Contact clinician for renal function evaluation.',
        },
      ],
      emergency: [
        {
          name: 'Signs of severe allergic reaction (angioedema)',
          easyExplanation: 'Swelling of the lips, tongue, face, or throat with difficulty breathing or swallowing',
          tamil: 'மூச்சுத்திணறல், முகம் அல்லது உதடுகள் வீக்கம் (தீவிர ஒவ்வாமை)',
          guidance: 'Seek immediate emergency medical care (Call 108/112).',
        },
        {
          name: 'Signs of high blood potassium (hyperkalemia)',
          easyExplanation: 'Severe muscle weakness, tingling, or irregular slow heart rhythm',
          tamil: 'கடுமையான தசை பலவீனம் அல்லது ஒழுங்கற்ற இதயத்துடிப்பு',
          guidance: 'Seek emergency hospital evaluation immediately.',
        },
      ],
    },

    // Missed Dose Guidance (Specific clinical rule - NOT universal)
    missedDose: {
      rule: 'If you miss a dose, take it as soon as you remember that day. If it is almost time for your next scheduled dose, skip the missed dose and resume your regular schedule. NEVER take two tablets at once to make up for a missed dose.',
      ruleTamil: 'மறந்த டோஸை அதே நாளில் நினைவுக்கு வந்தவுடன் எடுத்துக்கொள்ளலாம். அடுத்த மாத்திரைக்கான நேரம் நெருங்கிவிட்டால், மறந்ததை விட்டுவிட்டு அடுத்ததை சரியான நேரத்தில் எடுக்கவும். ஒரே நேரத்தில் இரண்டு மாத்திரைகளை எடுக்க வேண்டாம்.',
      note: 'If you miss more than two consecutive doses, consult your doctor or pharmacist.',
    },

    // Warnings & Allergies
    allergyWarning: 'Do not take if you have had an allergic reaction (such as swelling of face/lips) to Telmisartan or other ARB medications.',
    allergyWarningTamil: 'டெல்மிசார்டன் அல்லது தொடர்புடைய மருந்துகளுக்கு ஒவ்வாமை இருந்தால் எடுத்துக்கொள்ள வேண்டாம்.',
    
    drugInteractionWarning: 'Avoid potassium supplements or salt substitutes containing potassium without physician guidance. Non-steroidal anti-inflammatory drugs (NSAIDs like ibuprofen) may decrease blood pressure lowering effectiveness.',
    drugInteractionWarningTamil: 'பொட்டாசியம் சத்து மாத்திரைகள் அல்லது வலி நிவாரணிகளை (NSAIDs) மருத்துவ ஆலோசனை இல்லாமல் உட்கொள்ள வேண்டாம்.',

    foodAdvice: 'Take with or after food. Stay adequately hydrated, but avoid excessive salt or potassium supplements.',
    supplyInfo: {
      packQuantity: 30,
      refillThresholdDays: 7,
    },
  },

  med_2: {
    id: 'med_2',
    name: 'Metformin Hydrochloride',
    brandNames: ['Glucophage', 'Glycomet', 'Cetapin'],
    drugClass: 'Biguanide Antidiabetic',
    drugClassEasy: 'Medicine that helps lower blood sugar levels and improves insulin response',
    purpose: 'Used to manage type 2 diabetes mellitus and improve how your body processes blood sugar (glucose).',
    purposeTamil: 'இரத்த சர்க்கரை அளவைக் கட்டுப்படுத்தவும், நீரிழிவு மேலாண்மைக்கும் பயன்படுகிறது.',

    howToTake: 'Take with or immediately after meals to reduce stomach upset. Swallow whole with water; do not crush or chew extended-release tablets.',
    howToTakeTamil: 'வயிற்று அசௌகரியத்தைத் தவிர்க்க உணவு சாப்பிடும் போது அல்லது சாப்பிட்ட உடனே எடுத்துக்கொள்ளவும்.',

    sideEffects: {
      common: [
        {
          name: 'Nausea, stomach upset, or loose stools',
          easyExplanation: 'Mild stomach discomfort or frequent bowel movements',
          tamil: 'குமட்டல், வயிற்றுப்போக்கு அல்லது அஜீரணம்',
          guidance: 'Taking with meals reduces this effect. Usually improves after 1–2 weeks.',
        },
        {
          name: 'Metallic taste in the mouth',
          easyExplanation: 'Temporary slight metal-like taste while eating',
          tamil: 'வாயில் லேசான உலோகச் சுவை',
          guidance: 'Harmless and usually temporary. Inform doctor if it bothers you.',
        },
        {
          name: 'Loss of appetite',
          easyExplanation: 'Feeling full more quickly',
          tamil: 'பசியின்மை அல்லது விரைவில் வயிறு நிறைந்த உணர்வு',
          guidance: 'Monitor body weight. Inform doctor during routine review.',
        },
      ],
      important: [
        {
          name: 'Persistent severe diarrhea or vomiting',
          easyExplanation: 'Frequent fluid loss leading to dehydration',
          tamil: 'தொடர்ச்சியான கடுமையான வாந்தி அல்லது வயிற்றுப்போக்கு',
          guidance: 'Drink fluids to stay hydrated. Contact your doctor to prevent dehydration.',
        },
        {
          name: 'Tingling or numbness in fingers/toes',
          easyExplanation: 'Possible low vitamin B12 levels after long-term therapy',
          tamil: 'கை அல்லது கால் விரல்களில் மரத்துப்போதல்',
          guidance: 'Ask your doctor to check your Vitamin B12 levels during routine blood work.',
        },
      ],
      emergency: [
        {
          name: 'Signs of Lactic Acidosis (Rare but severe)',
          easyExplanation: 'Severe unusual tiredness, difficulty breathing, severe stomach pain, extreme coldness, or slow irregular heartbeat',
          tamil: 'அதிகப்படியான சோர்வு, தீவிர மூச்சுத்திணறல், தாங்க முடியாத வயிற்று வலி (லேக்டிக் அமிலத்தன்மை)',
          guidance: 'Stop the medication and go to the nearest emergency department immediately.',
        },
        {
          name: 'Severe allergic swelling or hives',
          easyExplanation: 'Sudden widespread rash or facial swelling with throat tightness',
          tamil: 'திடீர் தீவிர தடிப்பு அல்லது மூச்சுக்குழாய் வீக்கம்',
          guidance: 'Call national emergency services (108/112) immediately.',
        },
      ],
    },

    missedDose: {
      rule: 'Take the missed dose as soon as you remember with a meal or snack. If it is time for the next dose, skip the missed dose and resume your regular schedule. NEVER double up doses.',
      ruleTamil: 'மறந்த டோஸை உணவுடன் நினைவுக்கு வந்தவுடன் எடுக்கவும். அடுத்த வேளை நேரம் வந்துவிட்டால், மறந்ததை விட்டுவிடவும். இரட்டை டோஸ் எடுக்க வேண்டாம்.',
      note: 'Never take Metformin on an empty stomach to make up for a missed dose.',
    },

    allergyWarning: 'Do not take if you have severe kidney disease, severe liver impairment, or are scheduled for an iodinated contrast scan without doctor clearance.',
    allergyWarningTamil: 'கடுமையான சிறுநீரக அல்லது கல்லீரல் பாதிப்பு இருந்தால் மருத்துவர் அனுமதியின்றி எடுக்க வேண்டாம்.',

    drugInteractionWarning: 'Excessive alcohol intake increases the risk of lactic acidosis. Contrast dyes used in hospital CT/X-ray scans require temporary discontinuation.',
    drugInteractionWarningTamil: 'மது அருந்துவதைத் தவிர்க்கவும்; மருத்துவ ஸ்கேன் செய்யும் முன் மருத்துவரிடம் தெரிவிக்கவும்.',

    foodAdvice: 'Always take with food. Maintain a consistent carbohydrate and meal schedule.',
    supplyInfo: {
      packQuantity: 60,
      refillThresholdDays: 10,
    },
  },

  med_3: {
    id: 'med_3',
    name: 'Atorvastatin',
    brandNames: ['Lipitor', 'Atorva', 'Storvas'],
    drugClass: 'HMG-CoA Reductase Inhibitor (Statin)',
    drugClassEasy: 'Cholesterol-lowering medicine that protects arteries and heart health',
    purpose: 'Used to lower bad cholesterol (LDL) and triglycerides, and to reduce the risk of heart attack and stroke.',
    purposeTamil: 'கொலஸ்ட்ரால் அளவைக் குறைக்கவும், மாரடைப்பு மற்றும் பக்கவாத அபாயத்தைத் தடுக்கவும் பயன்படுகிறது.',

    howToTake: 'Take once daily in the evening or at bedtime with water, with or without food. Try to take it at the same time each evening.',
    howToTakeTamil: 'இரவில் படுக்கைக்குச் செல்லும் முன் ஒரு டம்ளர் தண்ணீருடன் எடுத்துக்கொள்ளவும்.',

    sideEffects: {
      common: [
        {
          name: 'Mild muscle ache or joint stiffness',
          easyExplanation: 'Mild soreness in back, arms, or legs',
          tamil: 'லேசான தசை வலி அல்லது மூட்டு இறுக்கம்',
          guidance: 'Inform your doctor if muscle aches become noticeable or persistent.',
        },
        {
          name: 'Mild headache or indigestion',
          easyExplanation: 'Slight head ache or mild gas after eating',
          tamil: 'லேசான தலைவலி அல்லது செரிமானக் குறைபாடு',
          guidance: 'Usually mild and self-limiting. Keep doctor informed.',
        },
        {
          name: 'Nasal irritation or throat soreness',
          easyExplanation: 'Feeling like a mild cold or scratchy throat',
          tamil: 'தொண்டை எரிச்சல் அல்லது லேசான மூக்கடைப்பு',
          guidance: 'Inform your doctor during next routine visit.',
        },
      ],
      important: [
        {
          name: 'Unexplained muscle pain or weakness with fever',
          easyExplanation: 'Muscle breakdown (rhabdomyolysis warning sign)',
          tamil: 'காரணமில்லாத தீவிர தசை வலி, பலவீனம் அல்லது காய்ச்சல்',
          guidance: 'Stop the medication and contact your doctor immediately.',
        },
        {
          name: 'Yellowing of skin or eyes (jaundice) or dark brown urine',
          easyExplanation: 'Warning sign of liver strain or inflammation',
          tamil: 'கண்கள் அல்லது தோல் மஞ்சள் நிறமாதல், அல்லது அடர் நிற சிறுநீர்',
          guidance: 'Contact your prescribing physician promptly for liver enzyme evaluation.',
        },
      ],
      emergency: [
        {
          name: 'Severe widespread muscle breakdown with tea-colored urine',
          easyExplanation: 'Rapid muscle tissue breakdown affecting kidney function',
          tamil: 'தீவிர தசைச் சிதைவு மற்றும் அடர் பழுப்பு நிற சிறுநீர் (மருத்துவ அவசரம்)',
          guidance: 'Go to the nearest emergency hospital department immediately.',
        },
        {
          name: 'Anaphylaxis (severe allergic reaction)',
          easyExplanation: 'Difficulty breathing, hives, swelling of throat or tongue',
          tamil: 'மூச்சுத்திணறல், தொண்டை வீக்கம், தீவிர ஒவ்வாமை',
          guidance: 'Seek immediate emergency medical care (Call 108/112).',
        },
      ],
    },

    missedDose: {
      rule: 'If you miss your evening dose, take it as soon as you remember if within 12 hours. If more than 12 hours have passed, skip the missed dose and take your next dose at the regular evening time. Do NOT double the dose.',
      ruleTamil: 'மறந்த டோஸை 12 மணி நேரத்திற்குள் நினைவுக்கு வந்தால் எடுக்கலாம். 12 மணி நேரத்திற்கு மேல் ஆகிவிட்டால் விட்டுவிட்டு, அடுத்த நாள் வழக்கமான நேரத்தில் எடுக்கவும். இரட்டை டோஸ் எடுக்க வேண்டாம்.',
      note: 'Never take two doses within 12 hours of each other.',
    },

    allergyWarning: 'Do not take if you have active liver disease or an allergy to statin medications.',
    allergyWarningTamil: 'செயலில் உள்ள கல்லீரல் நோய் அல்லது ஸ்டேடின் ஒவ்வாமை இருந்தால் தவிர்க்கவும்.',

    drugInteractionWarning: 'Avoid drinking large amounts of grapefruit juice (more than 1 glass per day), as it significantly increases the level of Atorvastatin in your bloodstream. Tell your doctor if you take clarithromycin, ketoconazole, or gemfibrozil.',
    drugInteractionWarningTamil: 'கிரேப்ஃப்ரூட் (பப்ளிமாஸ்) பழச்சாறு அருந்துவதைத் தவிர்க்கவும். பிற பூஞ்சை அல்லது நுண்ணுயிர் எதிர்ப்பு மருந்துகள் உட்கொண்டால் மருத்துவரிடம் தெரிவிக்கவும்.',

    foodAdvice: 'Can be taken with or without food. Avoid grapefruit juice.',
    supplyInfo: {
      packQuantity: 30,
      refillThresholdDays: 7,
    },
  },
};

/**
 * Glossary of medical terms with verified simple language explanations
 */
export const medicalGlossary = {
  hypertension: {
    term: 'Hypertension',
    simple: 'High blood pressure',
    tamil: 'உயர் இரத்த அழுத்தம்',
  },
  edema: {
    term: 'Edema',
    simple: 'Swelling caused by fluid buildup',
    tamil: 'நீர்க்கட்டு / உடலின் பாகங்களில் வீக்கம்',
  },
  adherence: {
    term: 'Adherence',
    simple: 'Taking your medicines as prescribed by your doctor',
    tamil: 'மருத்துவர் அறிவுறுத்தியபடி மருந்துகளை தவறாமல் உட்கொள்ளுதல்',
  },
  contraindication: {
    term: 'Contraindication',
    simple: 'A specific medical reason a medicine may not be safe for you',
    tamil: 'ஒரு குறிப்பிட்ட காரணத்திற்காக மருந்தை உட்கொள்ளத் தடை',
  },
  drugInteraction: {
    term: 'Drug interaction',
    simple: 'When one medicine can change the way another medicine works in your body',
    tamil: 'ஒரு மருந்து மற்றொரு மருந்தின் செயல்பாட்டை பாதிக்கும் நிலை',
  },
  dyspnea: {
    term: 'Dyspnea',
    simple: 'Shortness of breath / difficulty breathing',
    tamil: 'மூச்சுத்திணறல் / சுவாசிப்பதில் சிரமம்',
  },
  hypoglycemia: {
    term: 'Hypoglycemia',
    simple: 'Low blood sugar level',
    tamil: 'இரத்தத்தில் சர்க்கரை அளவு மிகவும் குறைதல்',
  },
  hyperglycemia: {
    term: 'Hyperglycemia',
    simple: 'High blood sugar level',
    tamil: 'இரத்தத்தில் சர்க்கரை அளவு அதிகரித்தல்',
  },
  hypotension: {
    term: 'Hypotension',
    simple: 'Low blood pressure',
    tamil: 'குறைந்த இரத்த அழுத்தம்',
  },
  tachycardia: {
    term: 'Tachycardia',
    simple: 'Fast heart rate (beating faster than normal)',
    tamil: 'வேகமான இதயத்துடிப்பு',
  },
};

/**
 * Safe fallback getter for medicine clinical details
 */
export const getVerifiedMedicine = (medId) => {
  return (
    verifiedMedicineDatabase[medId] || {
      id: medId,
      name: 'Medication',
      purpose: 'Information not available in verified clinical database. Please consult your doctor or pharmacist.',
      purposeTamil: 'மருத்துவ தகவல் கிடைக்கவில்லை. தயவுசெய்து உங்கள் மருத்துவர் அல்லது மருந்தாளரை அணுகவும்.',
      howToTake: 'Take exactly as prescribed on your prescription label.',
      howToTakeTamil: 'மருத்துவர் பரிந்துரைத்தபடி சரியாக உட்கொள்ளவும்.',
      sideEffects: {
        common: [],
        important: [],
        emergency: [
          {
            name: 'Severe allergic reaction',
            easyExplanation: 'Difficulty breathing, swelling of face or lips, severe rash',
            tamil: 'மூச்சுத்திணறல், முகம் வீக்கம், தீவிர ஒவ்வாமை',
            guidance: 'Seek immediate emergency medical attention (Call 108/112).',
          },
        ],
      },
      missedDose: {
        rule: 'Please contact your doctor or pharmacist for specific missed-dose instructions.',
        ruleTamil: 'மறந்த டோஸ் பற்றிய குறிப்பிட்ட வழிமுறைகளுக்கு உங்கள் மருத்துவர் அல்லது மருந்தாளரைத் தொடர்பு கொள்ளவும்.',
      },
      allergyWarning: 'Always notify your clinician of any known drug allergies.',
      drugInteractionWarning: 'Inform your doctor of all vitamins, herbal supplements, and other medications you are taking.',
      foodAdvice: 'Follow the specific instructions printed on your prescription.',
    }
  );
};
