import { GoogleGenAI } from "@google/genai";
import logger from '../config/logger.js';

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const AUTO_FLAG_THRESHOLD = parseFloat(process.env.AUTO_FLAG_THRESHOLD || '0.7');
const AUTO_REMOVE_THRESHOLD = parseFloat(process.env.AUTO_REMOVE_THRESHOLD || '0.9');

async function getGeminiResponse(prompt) {
  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = response.text;
    
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  
  const result = JSON.parse(cleaned);
  
  return result;
}

/**
 * Analyzes text content for policy violations using gemini-2.5-flash
 */
async function analyzeTextContent(content, communityRules = []) {
  const rulesContext = communityRules.length > 0
    ? `Community-specific rules:\n${communityRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
    : 'Apply general community guidelines.';

  
  const prompt = `
    You are a content moderation AI. Analyze posts for policy violations and return ONLY valid JSON.
    
    ${rulesContext}
    
    General policies to enforce:
    - No hate speech, racism, sexism, or discrimination
    - No harassment or personal attacks
    - No spam or repetitive promotional content
    - No misinformation or dangerous false claims
    - No explicit sexual content
    - No glorification of violence
    
    Return JSON with this exact structure:
    {
      "toxicityScore": <0.0-1.0>,
      "violationType": <"HATE_SPEECH"|"HARASSMENT"|"SPAM"|"MISINFORMATION"|"EXPLICIT_CONTENT"|"VIOLENCE"|"OTHER"|null>,
      "isViolation": <boolean>,
      "confidence": <0.0-1.0>,
      "reasoning": "<brief explanation>",
      "categories": {
          "hate_speech": <0.0-1.0>,
          "harassment": <0.0-1.0>,
          "spam": <0.0-1.0>,
          "misinformation": <0.0-1.0>,
          "explicit": <0.0-1.0>,
          "violence": <0.0-1.0>
      },
      "suggestedAction": <"APPROVE"|"FLAG"|"REMOVE">
    }
    
    Analyze this post:
    "${content}"
  `;
    
  return await getGeminiResponse(prompt);
}

/**
 * Analyzes image content using gemini-2.5-flash
 */
async function analyzeImageContent(imageUrl, communityRules = []) {
  const rulesContext = communityRules.length > 0
    ? `Community rules: ${communityRules.join('; ')}`
    : '';

  const prompt = [
    {
      text: `
        You are a content moderation AI analyzing images.
        
        ${rulesContext}
        
        Check for:
        - explicit content
        - violence/gore
        - hate symbols
        - harassment
        - spam
        
        Return ONLY valid JSON:
        {
          "toxicityScore": <0-1>,
          "violationType": <type|null>,
          "isViolation": <bool>,
          "confidence": <0-1>,
          "reasoning": "<text>",
          "suggestedAction": <"APPROVE"|"FLAG"|"REMOVE">
        }
      `
    },
    {
      fileData: {
        fileUri: imageUrl,
      }
    }
  ]
  
  return await getGeminiResponse(prompt);
  
}

/**
 * Full moderation pipeline - text + optional image
 */
async function moderatePost(content, imageUrl = null, communityRules = []) {
  try {
    const textAnalysis = await analyzeTextContent(content, communityRules);

    let finalAnalysis = textAnalysis;

    if (imageUrl) {
      const imageAnalysis = await analyzeImageContent(imageUrl, communityRules);
      // Merge: take worst score
      finalAnalysis = {
        ...textAnalysis,
        toxicityScore: Math.max(textAnalysis.toxicityScore, imageAnalysis.toxicityScore),
        isViolation: textAnalysis.isViolation || imageAnalysis.isViolation,
        violationType: imageAnalysis.isViolation ? imageAnalysis.violationType : textAnalysis.violationType,
        imageAnalysis,
        reasoning: `Text: ${textAnalysis.reasoning} | Image: ${imageAnalysis.reasoning}`
      };
    }

    // Determine auto-action
    let autoStatus = 'PENDING';
    if (finalAnalysis.toxicityScore >= AUTO_REMOVE_THRESHOLD) {
      autoStatus = 'REMOVED';
    } else if (finalAnalysis.toxicityScore >= AUTO_FLAG_THRESHOLD) {
      autoStatus = 'FLAGGED';
    } else if (!finalAnalysis.isViolation) {
      autoStatus = 'APPROVED';
    }

    return {
      analysis: finalAnalysis,
      autoStatus,
      autoModerated: autoStatus !== 'PENDING'
    };
  } catch (err) {
    logger.error(`AI moderation failed: ${err.message}`);

    // Fail safe: return pending for human review
    return {
      analysis: { toxicityScore: 0, isViolation: false, reasoning: 'AI analysis failed', suggestedAction: 'FLAG' },
      autoStatus: 'PENDING',
      autoModerated: false
    };
  }
}

/**
 * Analyze user behavior pattern and suggest trust score adjustment
 */
async function analyzeUserBehavior(recentPosts, currentTrustScore) {
  try {
    const summary = recentPosts.map((p) => ({
      status: p.status,
      score: p.aiScore,
      date: p.createdAt,
    }));

    const prompt = `
      Analyze user behavior from post history and return ONLY valid JSON.

      Return format:
      {
        "adjustment": <-20 to +10>,
        "reason": "<text>"
      }

      Guidelines:
      - Frequent violations → negative adjustment
      - Clean history → positive adjustment
      - Spam/toxic patterns → strong negative adjustment
      - Consistently safe posts → small positive adjustment

      Current trust score:
      ${currentTrustScore}

      Recent posts:
      ${JSON.stringify(summary)}
    `;

    return await getGeminiResponse(prompt);

  } catch (err) {
    logger.error(`User behavior analysis failed: ${err.message}`);

    return {
      adjustment: 0,
      reason: "Behavior analysis failed",
    };
  }
}

export { moderatePost, analyzeTextContent, analyzeImageContent, analyzeUserBehavior };