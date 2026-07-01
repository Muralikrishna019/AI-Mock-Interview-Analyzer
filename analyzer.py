import re, json, pickle, os, base64, tempfile
import numpy as np
import warnings
warnings.filterwarnings("ignore")

import nltk
nltk.download("stopwords", quiet=True)
nltk.download("wordnet", quiet=True)
nltk.download("punkt", quiet=True)

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize, sent_tokenize
from sentence_transformers import SentenceTransformer, util
from transformers import pipeline
from pydub import AudioSegment
import speech_recognition as sr

# ── Load models 
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

print("Loading SBERT model...")
_sbert_local = os.path.join(BASE_DIR, "sbert_model")
sbert_model = SentenceTransformer(_sbert_local if os.path.isdir(_sbert_local) else "all-MiniLM-L6-v2")

print("Loading sentiment model...")
sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english"
)

with open(os.path.join(BASE_DIR, "question_bank.json")) as f:
    QUESTION_BANK = json.load(f)

with open(os.path.join(BASE_DIR, "weights.pkl"), "rb") as f:
    WEIGHTS = pickle.load(f)

WEIGHTS_TEXT  = WEIGHTS["text"]
WEIGHTS_AUDIO = WEIGHTS["audio"]

stop_words  = set(stopwords.words("english"))
lemmatizer  = WordNetLemmatizer()

print(f"Analyzer ready — {len(QUESTION_BANK)} questions loaded")

# ── Preprocessing  
def preprocess_text(text):
    text   = text.lower()
    text   = re.sub(r"[^a-zA-Z0-9\s]", "", text)
    tokens = word_tokenize(text)
    tokens = [lemmatizer.lemmatize(t) for t in tokens
              if t not in stop_words and len(t) > 2]
    return tokens, " ".join(tokens)

def get_word_count(text):
    return len(text.split())

def get_sentence_count(text):
    return len(sent_tokenize(text))

def get_filler_word_count(text):
    fillers = ["um","uh","like","basically","you know",
               "kind of","sort of","actually","literally"]
    text_lower = text.lower()
    return sum(text_lower.count(f) for f in fillers)

# ── 4 Analysis functions  
def get_semantic_score(question, answer):
    q_emb = sbert_model.encode(question, convert_to_tensor=True)
    a_emb = sbert_model.encode(answer,   convert_to_tensor=True)
    return max(0.0, min(1.0, util.cos_sim(q_emb, a_emb).item()))

def get_sentiment_score(answer):
    result     = sentiment_pipeline(answer[:512])[0]
    label      = result["label"]
    confidence = result["score"]
    score      = confidence if label == "POSITIVE" else 1 - confidence
    return score, label, confidence

def get_keyword_score(answer, expected_keywords):
    answer_lower  = answer.lower()
    _, cleaned    = preprocess_text(answer)
    matched = [kw for kw in expected_keywords
               if kw.lower() in answer_lower
               or lemmatizer.lemmatize(kw.lower()) in cleaned]
    score = len(matched) / len(expected_keywords) if expected_keywords else 0
    return score, matched

def get_clarity_score(answer, q_data):
    word_count  = get_word_count(answer)
    sent_count  = get_sentence_count(answer)
    filler_count= get_filler_word_count(answer)
    min_w, max_w= q_data["min_words"], q_data["max_words"]

    if word_count < min_w:
        length_score = word_count / min_w
    elif word_count > max_w:
        length_score = max(0.5, 1 - (word_count - max_w) / max_w)
    else:
        length_score = 1.0

    avg_len = word_count / max(sent_count, 1)
    if 10 <= avg_len <= 25:
        structure_score = 1.0
    elif avg_len < 5:
        structure_score = 0.5
    else:
        structure_score = max(0.4, 1 - (avg_len - 25) / 50)

    filler_score  = 1 - min(0.4, filler_count * 0.05)
    clarity_score = (length_score * 0.4 + structure_score * 0.3 + filler_score * 0.3)
    return clarity_score, word_count, filler_count

# ── Audio functions  
def convert_to_wav(input_path):
    """Converts any audio format (mp4, mp3, m4a, ogg) to wav."""
    ext = input_path.rsplit(".", 1)[-1].lower()
    audio = AudioSegment.from_file(input_path, format=ext)
    duration_seconds = len(audio) / 1000
    wav_path = input_path.rsplit(".", 1)[0] + "_converted.wav"
    audio.export(wav_path, format="wav")
    return wav_path, duration_seconds

def transcribe_audio_file(audio_path):
    recognizer = sr.Recognizer()
    with sr.AudioFile(audio_path) as source:
        recognizer.adjust_for_ambient_noise(source, duration=0.5)
        audio_data = recognizer.record(source)
    try:
        return recognizer.recognize_google(audio_data, language="en-US"), None
    except sr.UnknownValueError:
        return "", "Could not understand audio"
    except sr.RequestError as e:
        return "", str(e)

def transcribe_from_base64(audio_base64, fmt="wav"):
    audio_bytes = base64.b64decode(audio_base64)
    with tempfile.NamedTemporaryFile(suffix=f".{fmt}", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
    if fmt != "wav":
        tmp_path, _ = convert_to_wav(tmp_path)
    transcript, error = transcribe_audio_file(tmp_path)
    os.unlink(tmp_path)
    return transcript, error

def get_audio_metrics(transcript, duration_seconds):
    words      = transcript.split()
    word_count = len(words)
    wpm        = (word_count / duration_seconds * 60) if duration_seconds > 0 else 0

    if 100 <= wpm <= 150:   pace_score = 1.0
    elif wpm < 100:         pace_score = max(0.25, wpm / 100)
    else:                   pace_score = max(0.25, 1 - (wpm - 150) / 150)

    filler_count = get_filler_word_count(transcript)
    filler_ratio = filler_count / max(word_count, 1)
    filler_score = max(0.0, 1.0 - filler_ratio * 5)

    return {
        "wpm":            round(wpm, 1),
        "pace_score":     round(pace_score, 3),
        "filler_count":   filler_count,
        "filler_score":   round(filler_score, 3),
        "delivery_score": round((pace_score * 0.5 + filler_score * 0.5), 3),
        "word_count":     word_count
    }

# ── Feedback generator  
def generate_feedback(semantic, sentiment, keyword, clarity,
                      matched_kws, q_data, word_count):
    feedback = []
    if semantic < 0.3:
        feedback.append("Your answer does not address the question. Focus your response directly.")
    elif semantic < 0.5:
        feedback.append("Partially relevant. Connect your points more directly to the question.")
    else:
        feedback.append("Good job staying on topic.")

    if sentiment < 0.4:
        feedback.append("Your tone seems uncertain. Use more confident language.")
    elif sentiment >= 0.75:
        feedback.append("Confident and positive tone — great delivery.")

    missing = [k for k in q_data["keywords"] if k not in matched_kws]
    if keyword < 0.3:
        feedback.append(f"Use more domain terms. Missing: {', '.join(missing[:4])}.")
    elif keyword < 0.6:
        feedback.append(f"Good vocabulary. Consider also: {', '.join(missing[:2])}.")
    else:
        feedback.append("Excellent use of relevant technical terms.")

    if word_count < q_data["min_words"]:
        feedback.append(f"Too short ({word_count} words). Aim for at least {q_data['min_words']}.")
    elif word_count > q_data["max_words"]:
        feedback.append(f"Too long ({word_count} words). Be more concise.")
    return feedback

# ── Master analyze function  
def analyze_answer(question_id, answer_text, input_mode="text",
                   duration_seconds=0, audio_base64=None, audio_format="wav"):

    q_data = next((q for q in QUESTION_BANK if q["id"] == question_id), None)
    if not q_data:
        return {"error": f"Question id {question_id} not found"}

    if input_mode == "audio" and audio_base64:
        transcript, error = transcribe_from_base64(audio_base64, fmt=audio_format)
        if error:
            return {"error": error}
        answer_text = transcript

    if not answer_text or len(answer_text.strip()) < 3:
        return {"error": "Answer is too short or empty"}

    semantic_score                          = get_semantic_score(q_data["question"], answer_text)
    sentiment_score, sent_label, sent_conf  = get_sentiment_score(answer_text)
    keyword_score,   matched_kws            = get_keyword_score(answer_text, q_data["keywords"])
    clarity_score,   word_count, filler_cnt = get_clarity_score(answer_text, q_data)

    semantic_score = semantic_score[0] if isinstance(semantic_score, tuple) else semantic_score

    audio_metrics = None
    if input_mode == "audio":
        audio_metrics  = get_audio_metrics(answer_text, duration_seconds)
        delivery_score = audio_metrics["delivery_score"]
        w = WEIGHTS_AUDIO
        final_score = (
            semantic_score  * w["semantic"]  +
            sentiment_score * w["sentiment"] +
            keyword_score   * w["keyword"]   +
            clarity_score   * w["clarity"]   +
            delivery_score  * w["delivery"]
        ) * 100
    else:
        w = WEIGHTS_TEXT
        final_score = (
            semantic_score  * w["semantic"]  +
            sentiment_score * w["sentiment"] +
            keyword_score   * w["keyword"]   +
            clarity_score   * w["clarity"]
        ) * 100

    feedback = generate_feedback(semantic_score, sentiment_score, keyword_score,
                                 clarity_score, matched_kws, q_data, word_count)

    if input_mode == "audio" and audio_metrics:
        wpm = audio_metrics["wpm"]
        if wpm > 170:
            feedback.append(f"Too fast ({wpm:.0f} WPM). Aim for 100-150 WPM.")
        elif wpm < 70:
            feedback.append(f"Too slow ({wpm:.0f} WPM). Speak more naturally.")
        else:
            feedback.append(f"Good speaking pace ({wpm:.0f} WPM).")
        if audio_metrics["filler_count"] > 5:
            feedback.append(f"{audio_metrics['filler_count']} filler words detected. Try pausing instead.")

    scores = {
        "semantic_relevance": round(semantic_score  * 100, 1),
        "sentiment":          round(sentiment_score * 100, 1),
        "keyword_match":      round(keyword_score   * 100, 1),
        "clarity":            round(clarity_score   * 100, 1),
        "overall":            round(final_score, 1)
    }
    if input_mode == "audio" and audio_metrics:
        scores["delivery"] = round(audio_metrics["delivery_score"] * 100, 1)

    return {
        "question":         q_data["question"],
        "answer":           answer_text,
        "input_mode":       input_mode,
        "scores":           scores,
        "sentiment_label":  sent_label,
        "matched_keywords": matched_kws,
        "word_count":       word_count,
        "filler_count":     filler_cnt,
        "audio_metrics":    audio_metrics,
        "feedback":         feedback,
        "category":         q_data["category"]
    }
