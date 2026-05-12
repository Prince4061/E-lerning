# EduQuest - Game Development Guide 🎮

यह डॉक्यूमेंट आपको बताएगा कि EduQuest प्लेटफॉर्म में नए गेम्स कैसे जोड़ें। 
हमने प्लेटफॉर्म को बहुत ही **Scalable (आसानी से बढ़ने वाला)** बना दिया है। अब आपको नया गेम जोड़ने के लिए किसी भी मुख्य फाइल (जैसे `app.py` या `app.js`) को छूने की ज़रूरत नहीं है!

---

## 🚀 नया गेम कैसे जोड़ें? (सिर्फ 2 स्टेप्स)

### Step 1: अपनी गेम की HTML फाइल बनाएँ
आपका पूरा गेम एक सिंगल HTML फाइल के अंदर होना चाहिए (जिसमें CSS और JavaScript भी शामिल हो)।

### Step 2: फाइल के ऊपर Metadata (JSON) जोड़ें
अपनी HTML फाइल में `<head>` टैग के तुरंत बाद यह `<script>` ब्लॉक जोड़ें:

```html
<script id="game-metadata" type="application/json">
{
  "game_id": "math-subtraction-2", 
  "title": "Minus Monster",
  "subject": "math",
  "level": 2,
  "concept": "Subtraction",
  "description": "Master subtraction with engaging gameplay!",
  "instructions": "Find the correct answer to complete the subtraction.",
  "pass_threshold": 70,
  "min_age": 6
}
</script>
```

**JSON Fields का मतलब:**
- `game_id`: गेम का एक यूनिक नाम (स्पेस के बिना)।
- `title`: गेम का नाम जो वेबसाइट पर दिखेगा।
- `subject`: `math` या `science`।
- `level`: गेम का कठिनाई स्तर (1, 2, 3...)।
- `concept`: बच्चा इस गेम से क्या सीखेगा (जैसे Addition, Plants)।
- `pass_threshold`: पास होने के लिए कितने % मार्क्स चाहिए (आमतौर पर 70)।

### Step 3: फाइल को सही फोल्डर में रखें
- अगर Math का गेम है तो: `static/games/math/` फोल्डर में सेव करें।
- अगर Science का गेम है तो: `static/games/science/` फोल्डर में सेव करें।

**बस! काम हो गया! 🎉**
जैसे ही आप सर्वर (`python app.py`) को रीस्टार्ट करेंगे, आपका नया गेम अपने आप वेबसाइट पर दिखने लगेगा!

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
