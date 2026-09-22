"""Lightweight, explainable rule-based triage engine.

This intentionally avoids any external AI/API dependency so the project
runs fully offline. It scans the patient's free-text symptom description
(and duration) for clinically-relevant keywords, assigns a severity score,
and produces short "tags" that let a doctor scan a case in a few seconds
instead of reading the full paragraph — the "shortlisting" the platform
is built around.
"""

import re

# (weight, tag, [regex patterns])
KEYWORD_RULES = [
    # Critical / emergency-grade symptoms
    (3, "Chest pain", [r"chest pain", r"tightness in chest"]),
    (3, "Breathing difficulty", [r"(difficulty|trouble) breathing", r"breathless", r"shortness of breath", r"can'?t breathe"]),
    (3, "Unconscious", [r"unconscious", r"fainted", r"passed out", r"not responding"]),
    (3, "Seizure", [r"seizure", r"convulsion", r"fits"]),
    (3, "Severe bleeding", [r"severe bleeding", r"heavy bleeding", r"blood loss"]),
    (3, "Suspected stroke", [r"stroke", r"slurred speech", r"face drooping", r"paraly[sz]"]),
    (3, "Suspected heart attack", [r"heart attack", r"cardiac"]),
    (3, "Poisoning", [r"poison", r"overdose", r"ingested chemical"]),
    (3, "Severe burn", [r"severe burn", r"third[- ]degree burn"]),
    (3, "Suicidal ideation", [r"suicidal", r"self[- ]harm", r"harm myself"]),

    # High priority
    (2, "High fever", [r"high fever", r"fever (of|above|over) ?1(0[3-9]|1\d)", r"104", r"103"]),
    (2, "Blood in stool/vomit/urine", [r"blood in (my )?(stool|vomit|urine|cough|sputum)", r"vomit(ing)? blood", r"coughing blood"]),
    (2, "Severe pain", [r"severe pain", r"unbearable pain", r"excruciating", r"worst pain"]),
    (2, "Persistent vomiting", [r"persistent vomit", r"vomiting (repeatedly|continuously|non[- ]?stop)"]),
    (2, "Confusion", [r"confusion", r"disorient", r"altered mental"]),
    (2, "Dehydration", [r"dehydrat"]),
    (2, "Severe swelling", [r"severe swelling", r"swelling.*(face|throat|lips)"]),
    (2, "Pregnancy complication", [r"pregnan(t|cy).*(bleeding|pain|complication)"]),
    (2, "High blood pressure", [r"high blood pressure", r"hypertension"]),
    (2, "Diabetic emergency", [r"blood sugar (very )?(high|low)", r"hypoglyc", r"hyperglyc"]),

    # Moderate / common presenting symptoms
    (1, "Fever", [r"\bfever\b"]),
    (1, "Headache", [r"headache", r"migraine"]),
    (1, "Vomiting", [r"vomit", r"nausea"]),
    (1, "Diarrhea", [r"diarrh(o|e)a", r"loose motion"]),
    (1, "Cough/cold", [r"\bcough\b", r"\bcold\b", r"sore throat", r"flu"]),
    (1, "Body ache", [r"body ache", r"joint pain", r"muscle pain", r"back pain"]),
    (1, "Skin rash", [r"rash", r"itching", r"allergy", r"allergic"]),
    (1, "Dizziness", [r"dizz", r"giddiness", r"vertigo"]),
    (1, "Stomach pain", [r"stomach pain", r"abdominal pain", r"stomach ache"]),
    (1, "Fatigue", [r"fatigue", r"weakness", r"tired"]),
    (1, "Infection", [r"infection", r"pus", r"wound"]),
]

# Duration modifiers — sudden/acute onset nudges urgency up, while a
# long-standing, stable complaint nudges it down slightly.
ACUTE_ONSET = [r"today", r"just now", r"sudden", r"since (this )?morning", r"few (minutes|hours)", r"\b1 ?hour", r"\b\d+ ?hours?\b"]
CHRONIC_ONSET = [r"month", r"year", r"long time", r"chronic"]


def _any_match(patterns, text):
    return any(re.search(pattern, text, re.IGNORECASE) for pattern in patterns)


def compute_triage(symptoms_text="", duration_text=""):
    text = symptoms_text or ""
    duration = duration_text or ""

    score = 0
    tags = []

    for weight, tag, patterns in KEYWORD_RULES:
        if _any_match(patterns, text):
            score += weight
            tags.append(tag)

    if _any_match(ACUTE_ONSET, duration):
        score += 1
    elif _any_match(CHRONIC_ONSET, duration):
        score = max(0, score - 1)

    if score >= 5:
        level = "High"
    elif score >= 2:
        level = "Medium"
    else:
        level = "Low"

    # Cap the number of tags shown so the shortlist card stays scannable,
    # while keeping them unique and in the order first matched.
    unique_tags = list(dict.fromkeys(tags))[:5]

    stripped = text.strip()
    headline = f"{stripped[:90].strip()}…" if len(stripped) > 90 else stripped

    return {
        "level": level,
        "score": score,
        "tags": unique_tags,
        "headline": headline,
    }
