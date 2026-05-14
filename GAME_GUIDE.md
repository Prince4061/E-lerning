# EduQuest - Game Development Guide 🎮

यह डॉक्यूमेंट आपको बताएगा कि EduQuest प्लेटफॉर्म में नए गेम्स कैसे जोड़ें। 
हमने प्लेटफॉर्म को बहुत ही **Scalable (आसानी से बढ़ने वाला)** बना दिया है। अब आपको नया गेम जोड़ने के लिए किसी भी मुख्य फाइल (जैसे `app.py` या `app.js`) को छूने की ज़रूरत नहीं है!

---

## 🚀 नया गेम और नया Topic कैसे जोड़ें?

हमने प्लेटफॉर्म को **Topic-Based (विषय आधारित)** और **Scalable** बना दिया है।

### Step 1: सही Topic फोल्डर बनाएँ या चुनें
- `static/games/math/` या `static/games/science/` के अंदर एक फोल्डर होना चाहिए (जैसे `addition/` या `nutrition/`)।
- अगर आप कोई नया Topic जोड़ रहे हैं, तो बस एक नया फोल्डर बना लीजिये!

### Step 2: अपनी गेम की HTML फाइल बनाएँ
आपका पूरा गेम एक सिंगल HTML फाइल के अंदर होना चाहिए। इस फाइल का नाम सीक्वेंशियल रखें (जैसे `level1.html`, `level2.html`) और इसे अपने टॉपिक फोल्डर में सेव करें।

### Step 3: फाइल के ऊपर Metadata (JSON) जोड़ें
अपनी HTML फाइल में `<head>` टैग के तुरंत बाद यह `<script>` ब्लॉक जोड़ें:

```html
<script id="game-metadata" type="application/json">
{
  "game_id": "math-addition-1", 
  "title": "Space Addition",
  "subject": "math",
  "level": 1,
  "concept": "Addition",
  "topic": "Addition",
  "is_premium": false,
  "description": "Master addition with engaging gameplay!",
  "instructions": "Find the correct sum to win.",
  "pass_threshold": 70,
  "min_age": 6
}
</script>
```

**JSON Fields का मतलब:**
- `game_id`: गेम का एक यूनिक नाम (स्पेस के बिना)।
- `title`: गेम का नाम जो वेबसाइट पर दिखेगा।
- `subject`: `math` या `science`।
- `level`: गेम का कठिनाई स्तर (1, 2, 3...) - हर नए टॉपिक का पहला गेम `level: 1` होना चाहिए।
- `topic`: यह बहुत ज़रूरी है! इसी नाम से UI पर नया कार्ड बनेगा (जैसे "Addition" या "Nutrition")।
- `is_premium`: `true` या `false`। अगर इसे `true` रखा तो यह गेम सिर्फ़ प्रीमियम यूज़र्स खेल पाएंगे (UI पर 👑 दिखेगा)।
- `concept`: बच्चा इस गेम से क्या सीखेगा।

**बस! काम हो गया! 🎉**
जैसे ही आप सर्वर (`python app.py`) को रीस्टार्ट करेंगे, बैकएंड आपके नए टॉपिक और नए गेम को खुद स्कैन कर लेगा। UI पर ऑटोमैटिकली टॉपिक का नया कार्ड बन जाएगा!

---

## 🛠️ गेम के अंदर स्कोर कैसे भेजें? (Game API)

चूँकि आपका गेम एक बड़े प्लेटफॉर्म के अंदर चलता है, आपको बच्चे का स्कोर प्लेटफॉर्म को भेजना होता है। इसके लिए इन 3 फंक्शन्स का इस्तेमाल करें:

1. **जब बच्चा सही जवाब दे (स्कोर बढ़ाने के लिए):**
   ```javascript
   EduQuest.submitScore(10); // 10 पॉइंट्स जुड़ जाएंगे
   ```

2. **जब बच्चा गलत जवाब दे (लाइफ कम करने के लिए):**
   ```javascript
   EduQuest.loseLife(); 
   ```

3. **जब गेम ख़त्म हो जाए:**
   ```javascript
   EduQuest.endGame();
   ```

### Initialization Function
हर गेम में एक शुरूआती (init) फंक्शन होना चाहिए जिसका नाम `[game_id]_init` हो।
उदाहरण के लिए, अगर आपका `game_id` है `"math-addition-1"`, तो आपके JavaScript में यह होना चाहिए:
```javascript
function math_addition_1_init() {
  // गेम यहाँ से शुरू करें
  startGame();
}
```

> [!TIP]
> **Pro Tip:** आप पहले से मौजूद फाइलों (जैसे `static/games/math/addition-level1.html`) को कॉपी (copy-paste) करके अपना नया गेम बनाना शुरू कर सकते हैं। इससे आपको आसानी होगी!
