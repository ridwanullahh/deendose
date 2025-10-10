# AI Validation Methodology

## Overview

DeenDose employs a sophisticated multi-agent AI validation system to ensure all AI-generated Tafseer (exegesis) content is accurate, authentic, and aligned with the orthodox Islamic understanding according to the methodology of Ahlus Sunnah wal Jama'ah.

## Chain-of-Critique Pattern

The system uses a sequential chain of specialized AI agents, where each agent has a specific validation responsibility. Content must pass through all agents successfully or be rejected and regenerated.

## Agent Architecture

### Agent 1: Content Generator

**Role**: Initial Tafseer generation

**Responsibilities**:
- Generate comprehensive Tafseer based on the verse/Hadith
- Reference classical scholars (Ibn Kathir, At-Tabari, As-Sa'di, etc.)
- Provide key points and practical applications
- Structure output in standardized JSON format

**Validation Criteria**:
- Must include proper source citations
- 2-3 paragraph summary
- 3-5 key points
- 2-4 practical applications

**Output Format**:
```json
{
  "summary": "Detailed explanation...",
  "keyPoints": ["Point 1", "Point 2", ...],
  "practicalApplications": ["Application 1", ...],
  "sources": ["Ibn Kathir", "At-Tabari", ...]
}
```

---

### Agent 2: Web Search Validator

**Role**: External verification against trusted Islamic websites

**Responsibilities**:
- Search trusted Islamic websites for verse/topic
- Compare AI-generated content with scholarly sources
- Identify contradictions or inaccuracies
- Provide supporting URLs

**Trusted Sources**:
- dorar.net (Hadith encyclopedia)
- islamqa.info (Sheikh Ibn Baz, Ibn Uthaymeen fatwas)
- islamweb.net (Comprehensive Islamic content)
- dar-alifta.org (Official fatwa sites)
- binbaz.org.sa (Sheikh Ibn Baz official site)

**Search Queries**:
- "Surah [Name] Ayah [Number] tafsir Ibn Kathir"
- "Verse explanation [topic]"
- "[Surah:Ayah] Islamic ruling"

**Validation Criteria**:
- AI content aligns with web sources
- No contradictions found
- Key points supported by online scholarship

**Rejection Reasons**:
- Content contradicts trusted sources
- Cannot find supporting evidence online
- Significant theological discrepancies

---

### Agent 3: Theological Validator

**Role**: Ensure Aqeedah (creed) soundness

**Responsibilities**:
- Verify alignment with Tawheed principles
- Check attributes of Allah mentioned correctly
- Ensure no contradictions with Quran/Sunnah
- Identify any innovations (bid'ah)

**Theological Checkpoints**:
1. **Tawheed**: Oneness of Allah properly emphasized
2. **Names & Attributes**: Correctly affirmed without distortion
3. **Prophetic Position**: Prophet (ﷺ) honored appropriately
4. **Quranic Authority**: Quran as ultimate source
5. **Sunnah Adherence**: Hadith given proper weight

**Red Flags**:
- Anthropomorphism or ta'wil (distortion)
- Rationalistic interpretations contradicting tradition
- Philosophical speculation without textual basis
- Sufi or Ash'ari interpretations if not grounded

**Approval Criteria**:
- Orthodox Aqeedah maintained
- No theological innovations
- Aligned with Salafi understanding (without sectarian labels)

---

### Agent 4: Methodology Validator

**Role**: Verify correct Tafseer methodology

**Responsibilities**:
- Ensure Tafseer al-Quran bil-Quran (Quran by Quran)
- Verify Sunnah used to explain Quran
- Check statements of Companions referenced
- Validate literal understanding unless evidence for metaphorical

**Correct Methodology**:
1. **First**: Explain Quran with other Quranic verses
2. **Second**: Use authentic Hadith for explanation
3. **Third**: Reference statements of Companions
4. **Fourth**: Rely on classical scholars' consensus
5. **Fifth**: Use Arabic language rules

**Validation Points**:
- Hierarchical approach followed
- Not jumping to personal opinions
- Classical scholarship properly weighted
- Context (asbab al-nuzul) considered if relevant

**Rejection Triggers**:
- Modern interpretations without classical basis
- Personal speculation presented as fact
- Ignoring explicit Hadith explanations
- Sectarian methodologies

---

### Agent 5: Source Attribution Validator

**Role**: Verify proper scholarly citations

**Responsibilities**:
- Check all claims attributed to scholars
- Ensure recognized scholars referenced
- Verify no fabricated attributions
- Confirm appropriate scholar for topic

**Accepted Scholars List**:
- **Tafseer**: Ibn Kathir, At-Tabari, As-Sa'di, Al-Qurtubi, Al-Baghawi
- **Hadith**: Al-Albani, Ibn Hajr, An-Nawawi, Ibn Hajar al-Asqalani
- **Fiqh**: Ibn Taymiyyah, Ibn Qayyim, Ibn Uthaymeen, Ibn Baz
- **Aqeedah**: Ibn Taymiyyah, Muhammad ibn Abdul Wahhab, Al-Fawzan

**Citation Requirements**:
- At least 2 classical scholars cited
- Specific attribution (not vague "scholars say")
- Appropriate scholar for subject matter
- No weak or unknown sources

**Auto-Rejection Conditions**:
- No scholar citations
- Only contemporary scholars without classical basis
- Unrecognized or controversial sources
- Fabricated quotes

---

### Agent 6: Cross-Reference Validator

**Role**: Comprehensive consistency check

**Responsibilities**:
- Verify related Quranic verses support interpretation
- Check Hadith complements the verse appropriately
- Ensure practical applications logically follow
- Identify any internal contradictions

**Validation Checks**:
1. **Verse Coherence**: Related verses support interpretation
2. **Hadith Relevance**: Hadith truly relates to verse topic
3. **Logical Flow**: Key points follow from explanation
4. **Practical Realism**: Applications are achievable
5. **Consistency**: No contradictory statements within content

**Approval Criteria**:
- All cross-references valid
- Hadith and verse complement each other
- Practical advice is sound and implementable
- Theologically and logically consistent

---

### Agent 7: Synthesis Agent

**Role**: Final compilation and refinement

**Responsibilities**:
- Compile feedback from all agents
- Refine content based on critiques
- Ensure polished final output
- Apply any necessary corrections

**Synthesis Process**:
1. Review all agent feedback
2. Identify approved vs rejected elements
3. If all approved: Finalize content
4. If any rejected: Refine based on feedback
5. Output final validated Tafseer

**Final Output**:
- Grammatically correct
- Properly formatted
- All citations in place
- Ready for publication

---

## Rejection and Retry Mechanism

### Rejection Flow:
1. Any agent rejects → Content fails validation
2. System logs rejection reason
3. Automatic retry with **different** verse/Hadith
4. Maximum 3 attempts
5. After 3 failures → Skip that day, alert admin

### Retry Strategy:
- **Attempt 1**: Original verse + original Hadith
- **Attempt 2**: New random verse + new Hadith (same theme)
- **Attempt 3**: New random verse + new Hadith (random theme)

### Logging:
All validation decisions logged to `db/ai-validation-logs.json`:
```json
{
  "verseReference": "Al-Baqarah 2:255",
  "timestamp": "2025-01-15T06:00:00Z",
  "approved": true,
  "validationChain": [
    {
      "agent": "Agent 1: Content Generator",
      "approved": true,
      "feedback": "Generated successfully"
    },
    // ... all agents
  ],
  "totalAgents": 7,
  "approvedAgents": 7,
  "rejectedAgents": 0
}
```

---

## Web Search Integration

### SerpAPI Configuration:
```env
SERP_API_KEY=your_key
WEB_SEARCH_ENABLED=true
TRUSTED_ISLAMIC_SITES=dorar.net,islamqa.info,islamweb.net
```

### Search Process:
1. Generate 3 search queries per verse
2. Search using SerpAPI
3. Filter results to trusted domains only
4. Extract snippets for comparison
5. AI validates against search results

### Fallback Mode:
If web search unavailable:
- Increase agents to 9-10
- More rigorous internal validation
- Heavier reliance on trained knowledge
- Conservative approval threshold

---

## Quality Metrics

### Target Standards:
- **Approval Rate**: 60-80% on first attempt
- **Retry Success**: 90%+ on second attempt
- **Theological Accuracy**: 100% (non-negotiable)
- **Source Attribution**: 100% (must have citations)

### Monitoring:
- Daily validation success rate
- Common rejection reasons
- Agent-specific approval rates
- Source diversity

---

## Example Validation Scenario

### Input:
```
Verse: Al-Baqarah 2:255 (Ayat al-Kursi)
Hadith: "Whoever recites Ayat al-Kursi after every prayer..."
```

### Agent 1 Output:
Generates comprehensive Tafseer with:
- Explanation of Allah's names (Al-Hayy, Al-Qayyum)
- Significance of the verse
- Benefits of recitation
- Sources: Ibn Kathir, At-Tabari

### Agent 2 Validates:
- Searches "Ayat al-Kursi tafsir Ibn Kathir"
- Finds islamweb.net article
- Confirms explanation matches
- **Approved**

### Agent 3 Validates:
- Checks Tawheed emphasis (Allah's uniqueness)
- Verifies attributes mentioned correctly
- Confirms no innovations
- **Approved**

### Agent 4 Validates:
- Verifies literal interpretation maintained
- Checks classical methodology followed
- Confirms proper sources used
- **Approved**

### Agent 5 Validates:
- Confirms Ibn Kathir cited correctly
- Verifies At-Tabari attribution
- Checks scholars are recognized
- **Approved**

### Agent 6 Validates:
- Confirms Hadith relevance
- Checks practical benefits logical
- Verifies internal consistency
- **Approved**

### Agent 7 Synthesis:
- All agents approved
- Finalizes formatted content
- **Content Ready for Queue**

---

## Best Practices

1. **Never Bypass Validation**: All content must pass full chain
2. **Log Everything**: Transparency in AI decisions
3. **Regular Audits**: Human review of sample content
4. **Scholar Consultation**: Periodic verification by actual scholars
5. **Community Feedback**: Monitor comments for corrections

---

**May Allah guide us to what is correct and protect us from error.**

*This validation system is designed to minimize AI hallucinations and ensure authentic Islamic knowledge dissemination.*
