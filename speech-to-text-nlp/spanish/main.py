import azure.cognitiveservices.speech as speechsdk
import json
import time
import re
import locale

locale.setlocale(locale.LC_ALL, '')

# Replace with your actual subscription key and region
subscription_key = ""
region = ""

# Comprehensive Spanish IPA Dictionary
SPANISH_IPA = {
    # Simple Vowels
    'a': 'a',
    'e': 'e',
    'i': 'i',
    'o': 'o',
    'u': 'u',
    
    # Stressed Vowels
    'á': 'ˈa',
    'é': 'ˈe',
    'í': 'ˈi',
    'ó': 'ˈo',
    'ú': 'ˈu',
    
    # Diphthongs (Rising)
    'ia': 'ja',
    'ie': 'je',
    'io': 'jo',
    'iu': 'ju',
    'ua': 'wa',
    'ue': 'we',
    'ui': 'wi',
    'uo': 'wo',
    
    # Diphthongs (Falling)
    'ai': 'aj',
    'ay': 'aj',
    'ei': 'ej',
    'ey': 'ej',
    'oi': 'oj',
    'oy': 'oj',
    'au': 'aw',
    'eu': 'ew',
    'ou': 'ow',
    
    # Consonants (with allophones)
    'b': {
        'initial': 'b',      # word-initial or after nasal
        'intervocalic': 'β', # between vowels
        'default': 'β'
    },
    'v': {
        'initial': 'b',      # word-initial or after nasal (same as 'b')
        'intervocalic': 'β', # between vowels
        'default': 'β'
    },
    'c': {
        'e': 'θ',  # Before 'e'
        'i': 'θ',  # Before 'i'
        'default': 'k'  # In other positions
    },
    'd': {
        'initial': 'd',      # word-initial or after nasal/l
        'intervocalic': 'ð', # between vowels
        'final': 'ð',        # word-final
        'default': 'ð'
    },
    'g': {
        'initial': 'g',      # word-initial or after nasal
        'intervocalic': 'ɣ', # between vowels
        'e': 'x',           # before e/i
        'i': 'x',           # before e/i
        'default': 'g'
    },
    
    # Special Consonant Combinations
    'ch': 'tʃ',
    'll': {
        'spain': 'ʎ',    # traditional Spanish
        'latam': 'ʝ',    # Latin American Spanish
        'default': 'ʝ'   # most common modern pronunciation
    },
    'ñ': 'ɲ',
    'rr': 'r',           # trilled r
    
    # Single Consonants
    'f': 'f',
    'h': '',             # silent
    'j': 'x',
    'k': 'k',
    'l': 'l',
    'm': 'm',
    'n': {
        'default': 'n',
        'velar': 'ŋ'     # before velar consonants
    },
    'p': 'p',
    'q': 'k',
    'r': {
        'initial': 'r',   # word-initial (trilled)
        'intervocalic': 'ɾ', # between vowels (tapped)
        'final': 'ɾ',     # word-final (tapped)
        'preconsonantal': 'ɾ', # before consonants
        'default': 'ɾ'
    },
    's': {
        'default': 's',
        'voiced': 'z'     # before voiced consonants
    },
    't': 't',
    'w': 'w',
    'x': {
        'default': 'ks',
        'intervocalic': 'ɣs' # sometimes between vowels
    },
    'y': {
        'consonant': 'ʝ',  # as consonant
        'semivowel': 'j',  # as semivowel
        'default': 'ʝ'
    },
    'z': {
        'spain': 'θ',     # Spain Spanish
        'latam': 's',     # Latin American Spanish
        'default': 's'
    },
    
    # Common Sequences
    'gue': 'ge',
    'gui': 'gi',
    'que': 'ke',
    'qui': 'ki',
    'güe': 'gwe',
    'güi': 'gwi',
    
    # Positional Variants
    'word_initial': {
        'b': 'b',
        'd': 'd',
        'g': 'g',
        'r': 'r',
        'y': 'ʝ'
    },
    
    # Special Contexts
    'intervocalic': {
        'b': 'β',
        'd': 'ð',
        'g': 'ɣ',
        'r': 'ɾ'
    },
    
    # Assimilation Patterns
    'nasal_assimilation': {
        'b': 'm',
        'p': 'm',
        'f': 'ɱ',
        'd': 'n',
        't': 'n',
        'k': 'ŋ',
        'g': 'ŋ'
    },
    
    # Add these new entries for 'gu' combinations
    'gu': {
        'e': 'g',    # before 'e'
        'i': 'g',    # before 'i'
        'default': 'g'
    },
    'qu': {
        'e': 'k',    # before 'e'
        'i': 'k',    # before 'i'
        'default': 'k'
    },
    'gue': 'ge',
    'gui': 'gi',
    'güe': 'gwe',
    'güi': 'gwi',
    
    # Common Sequences
    'que': 'ke',
    'qui': 'ki',
    
    # Single letters
    'a': 'a',
    'b': 'b',
    'c': {
        'e': 'θ',  # Before 'e'
        'i': 'θ',  # Before 'i'
        'default': 'k'  # In other positions
    },
    'd': 'd',
    'e': 'e',
    'f': 'f',
    'g': 'g',
    'h': '',  # Silent in Spanish
    'i': 'i',
    'j': 'x',
    'k': 'k',
    'l': 'l',
    'm': 'm',
    'n': 'n',
    'ñ': 'ɲ',
    'o': 'o',
    'p': 'p',
    'q': 'k',
    'r': {
        'initial': 'r',
        'default': 'ɾ'
    },
    's': 's',
    't': 't',
    'u': 'u',
    'v': 'b',
    'w': 'w',
    'x': 'ks',
    'y': 'ʝ',
    'z': 'θ',
    
    # Common sequences
    'ci': 'θi',
    'ce': 'θe',
    'cia': 'θia',
}

# List of prompts
prompts = [
    # "Hola, ¿puedo ver el menú por favor?",
    # "Quiero un café con leche, por favor.",
    # "Sí, me gustaría un sándwich de huevo.",
    # "¿Qué tipo de muffin es ese?",
    "No, gracias, no hoy.",
    "¿Puedo pagar con tarjeta?",
    "Bien, aquí está. Aquí están seis dólares.",
    "Gracias"
]

def get_spanish_phonemes(word, dialect='spain'):
    """
    Convert a Spanish word to its IPA representation with comprehensive phonetic rules
    """
    phonemes = []
    i = 0
    word = word.lower()
    vowels = 'aeiouáéíóú'
    
    def is_vowel(char):
        return char in vowels
    
    def get_next_chars(pos, count=1):
        return word[pos:pos + count] if pos + count <= len(word) else ''
    
    while i < len(word):
        # Check for special sequences first
        three_chars = get_next_chars(i, 3)
        if three_chars == 'cia':
            phonemes.append({
                'Phoneme': 'θ' if dialect == 'spain' else 's',
                'PronunciationAssessment': {'AccuracyScore': 100.0},
                'Position': 'middle'
            })
            phonemes.append({
                'Phoneme': 'i',
                'PronunciationAssessment': {'AccuracyScore': 100.0},
                'Position': 'middle'
            })
            phonemes.append({
                'Phoneme': 'a',
                'PronunciationAssessment': {'AccuracyScore': 100.0},
                'Position': 'middle'
            })
            i += 3
            continue
        
        # Check for two-character combinations
        two_chars = get_next_chars(i, 2)
        if two_chars in ['ce', 'ci']:
            phonemes.append({
                'Phoneme': 'θ' if dialect == 'spain' else 's',
                'PronunciationAssessment': {'AccuracyScore': 100.0},
                'Position': 'middle'
            })
            phonemes.append({
                'Phoneme': two_chars[1],
                'PronunciationAssessment': {'AccuracyScore': 100.0},
                'Position': 'middle'
            })
            i += 2
            continue
        
        # Handle single characters
        char = word[i]
        if char == 'c':
            next_char = get_next_chars(i + 1, 1)
            if next_char in 'ei':
                phonemes.append({
                    'Phoneme': 'θ' if dialect == 'spain' else 's',
                    'PronunciationAssessment': {'AccuracyScore': 100.0},
                    'Position': 'middle'
                })
            else:
                phonemes.append({
                    'Phoneme': 'k',
                    'PronunciationAssessment': {'AccuracyScore': 100.0},
                    'Position': 'middle'
                })
        elif char in SPANISH_IPA:
            phoneme = SPANISH_IPA[char]
            if isinstance(phoneme, dict):
                if i == 0 and 'initial' in phoneme:
                    phoneme = phoneme['initial']
                else:
                    phoneme = phoneme['default']
            
            phonemes.append({
                'Phoneme': phoneme,
                'PronunciationAssessment': {'AccuracyScore': 100.0},
                'Position': 'initial' if i == 0 else 'final' if i == len(word)-1 else 'middle'
            })
        
        i += 1
    
    return phonemes

def create_speech_recognizer(reference_text):
    """
    Create and configure a speech recognizer for Spanish pronunciation assessment
    """
    speech_config = speechsdk.SpeechConfig(subscription=subscription_key, region=region)
    speech_config.speech_recognition_language = "es-ES"
    audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)
    speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)
    
    pronunciation_assessment_config = speechsdk.PronunciationAssessmentConfig(
        reference_text=reference_text,
        grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
        granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
        enable_miscue=True
    )
    pronunciation_assessment_config.apply_to(speech_recognizer)
    
    return speech_recognizer

def calculate_weighted_score(reference_word_assessments, pronunciation_score, fluency_score, completeness_score):
    """
    Calculate a weighted custom score taking into account multiple factors
    """
    # Word-level analysis
    word_scores = []
    word_weights = []
    
    for word in reference_word_assessments:
        # Calculate average phoneme score for the word
        phoneme_scores = [p['PronunciationAssessment']['AccuracyScore'] for p in word['phonemes']]
        avg_phoneme_score = sum(phoneme_scores) / len(phoneme_scores) if phoneme_scores else 0
        
        # Word length-based weight (longer words count more)
        weight = len(word['phonemes']) / 2  # Base weight on phoneme count
        
        # Adjust weight based on error type
        if word['error_type'] == 'Omission':
            weight *= 1.5  # Penalize missing words more heavily
        elif word['error_type'] == 'Substitution':
            weight *= 1.2  # Penalize substitutions
        
        word_scores.append(avg_phoneme_score)
        word_weights.append(weight)
    
    # Calculate weighted word score
    total_weight = sum(word_weights)
    weighted_word_score = sum(score * weight for score, weight in zip(word_scores, word_weights)) / total_weight if total_weight > 0 else 0

    # Define importance weights for different components
    weights = {
        'word_accuracy': 0.35,      # How well individual words were pronounced
        'pronunciation': 0.25,      # Overall pronunciation score from Azure
        'fluency': 0.20,           # Smoothness of speech
        'completeness': 0.20       # Whether all words were attempted
    }

    # Calculate final weighted score
    final_score = (
        weighted_word_score * weights['word_accuracy'] +
        pronunciation_score * weights['pronunciation'] +
        fluency_score * weights['fluency'] +
        completeness_score * weights['completeness']
    )

    # Penalty factors
    penalties = {
        'missing_words': 0.8,      # Severe penalty for missing words
        'low_fluency': 0.9,        # Moderate penalty for choppy speech
        'low_completeness': 0.85   # Significant penalty for incomplete phrases
    }

    # Apply penalties if necessary
    if any(word['error_type'] == 'Omission' for word in reference_word_assessments):
        final_score *= penalties['missing_words']
    if fluency_score < 70:
        final_score *= penalties['low_fluency']
    if completeness_score < 80:
        final_score *= penalties['low_completeness']

    return final_score, weighted_word_score

def analyze_pronunciation_errors(word_assessment):
    """
    Analyze phoneme-level errors and provide educational feedback
    """
    feedback = []
    low_score_threshold = 70  # Score below this needs improvement
    
    # Get problematic phonemes
    problem_phonemes = [
        p for p in word_assessment['phonemes'] 
        if p['PronunciationAssessment']['AccuracyScore'] < low_score_threshold
    ]
    
    if problem_phonemes:
        feedback.append(f"\nIn the word '{word_assessment['word']}', let's work on:")
        
        for phoneme in problem_phonemes:
            # Educational feedback based on specific phonemes
            tips = {
                'r': "Try rolling your 'r' sound more. Place your tongue near the roof of your mouth.",
                'ɾ': "This is a soft 'r'. Quickly tap your tongue once against the roof of your mouth.",
                'θ': "For this 'th' sound (like in 'think'), place your tongue between your teeth.",
                'x': "For the Spanish 'j', make a sound like the 'h' in 'huge', but stronger.",
                'ɲ': "For the 'ñ' sound, say 'ny' as in 'canyon', but as one smooth sound.",
                'β': "For this 'b/v' sound, keep your lips relaxed and barely touching.",
                'ð': "Make this 'd' sound with your tongue between your teeth, very gently.",
                'ʝ': "For this 'll' sound, say 'y' as in 'yes', but with more friction.",
                'ʎ': "Touch the roof of your mouth with your tongue, like saying 'li' in 'million'."
            }
            
            feedback.append(f"  • The sound '{phoneme['Phoneme']}' (score: {phoneme['PronunciationAssessment']['AccuracyScore']:.1f})")
            if phoneme['Phoneme'] in tips:
                feedback.append(f"    Tip: {tips[phoneme['Phoneme']]}")

    return feedback

def recognize_and_assess(speech_recognizer, reference_text):
    """
    Perform speech recognition and pronunciation assessment with detailed phoneme analysis
    """
    done = False
    recognized_result = None
    speech_detected = False

    def stop_cb(evt):
        nonlocal done
        done = True

    def recognized_cb(evt):
        nonlocal recognized_result
        recognized_result = evt.result
        nonlocal done
        done = True

    def recognizing_cb(evt):
        nonlocal speech_detected
        speech_detected = True

    # Connect callbacks
    speech_recognizer.recognizing.connect(recognizing_cb)
    speech_recognizer.recognized.connect(recognized_cb)
    speech_recognizer.session_started.connect(lambda evt: None)
    speech_recognizer.session_stopped.connect(lambda evt: None)
    speech_recognizer.canceled.connect(lambda evt: None)
    speech_recognizer.session_stopped.connect(stop_cb)
    speech_recognizer.canceled.connect(stop_cb)

    speech_recognizer.start_continuous_recognition()

    start_time = time.time()
    while not done and time.time() - start_time < 10:
        time.sleep(0.1)

    speech_recognizer.stop_continuous_recognition()

    if not recognized_result:
        return {
            "error": {
                "type": "NoSpeech",
                "message": "No speech recognized within the timeout period."
            }
        }

    if recognized_result.reason == speechsdk.ResultReason.RecognizedSpeech:
        try:
            assessment_results = json.loads(
                recognized_result.properties[speechsdk.PropertyId.SpeechServiceResponse_JsonResult]
            )
            
            pronunciation_assessment = assessment_results['NBest'][0].get('PronunciationAssessment', {})
            pronunciation_score = pronunciation_assessment.get('PronScore', 0)
            fluency_score = pronunciation_assessment.get('FluencyScore', 0)
            completeness_score = pronunciation_assessment.get('CompletenessScore', 0)
            accuracy_score = pronunciation_assessment.get('AccuracyScore', 0)

            azure_words = assessment_results['NBest'][0].get('Words', [])
            reference_words = reference_text.lower().replace('¿', '').replace('?', '').replace(',', '').replace('.', '').split()
            reference_word_assessments = []

            for ref_word in reference_words:
                ipa_phonemes = get_spanish_phonemes(ref_word, dialect='spain')
                matching_word = next(
                    (w for w in azure_words if w['Word'].lower() == ref_word.lower()),
                    None
                )
                
                if matching_word:
                    azure_phonemes = matching_word.get('Phonemes', [])
                    combined_phonemes = []
                    
                    for i, ipa_phoneme in enumerate(ipa_phonemes):
                        score = 0.0
                        if i < len(azure_phonemes):
                            score = azure_phonemes[i].get('PronunciationAssessment', {}).get('AccuracyScore', 0.0)
                        
                        combined_phonemes.append({
                            'Phoneme': ipa_phoneme['Phoneme'],
                            'PronunciationAssessment': {
                                'AccuracyScore': score
                            }
                        })
                    
                    word_accuracy = matching_word['PronunciationAssessment']['AccuracyScore']
                    error_type = matching_word['PronunciationAssessment']['ErrorType']
                else:
                    combined_phonemes = [{
                        'Phoneme': p['Phoneme'],
                        'PronunciationAssessment': {
                            'AccuracyScore': 0.0
                        }
                    } for p in ipa_phonemes]
                    word_accuracy = 0.0
                    error_type = 'Omission'
                
                reference_word_assessments.append({
                    'word': ref_word,
                    'accuracy_score': word_accuracy,
                    'error_type': error_type,
                    'phonemes': combined_phonemes
                })

            custom_score, weighted_word_score = calculate_weighted_score(
                reference_word_assessments,
                pronunciation_score,
                fluency_score,
                completeness_score
            )

            output_json = {
                "assessment_result": {
                    "status": "success" if custom_score >= 85.0 else "failure",
                    "reference_text": reference_text,
                    "recognized_text": recognized_result.text,
                    "scores": {
                        "overall_score": round(custom_score, 1),
                        "pronunciation_score": round(pronunciation_score, 1),
                        "fluency_score": round(fluency_score, 1),
                        "completeness_score": round(completeness_score, 1),
                        "accuracy_score": round(accuracy_score, 1)
                    },
                    "words": [],
                    "learning_feedback": []
                }
            }

            for word_assess in reference_word_assessments:
                word_json = {
                    "word": word_assess["word"],
                    "accuracy_score": round(word_assess["accuracy_score"], 1),
                    "error_type": word_assess["error_type"],
                    "phonemes": []
                }

                for phoneme in word_assess["phonemes"]:
                    word_json["phonemes"].append({
                        "phoneme": phoneme["Phoneme"],
                        "score": round(phoneme["PronunciationAssessment"]["AccuracyScore"], 1)
                    })

                output_json["assessment_result"]["words"].append(word_json)

                if word_assess["accuracy_score"] < 75:
                    feedback = analyze_pronunciation_errors(word_assess)
                    if feedback:
                        output_json["assessment_result"]["learning_feedback"].extend(feedback)

            return output_json

        except Exception as e:
            return {
                "error": {
                    "type": type(e).__name__,
                    "message": str(e)
                }
            }

    elif recognized_result.reason == speechsdk.ResultReason.NoMatch:
        return {
            "error": {
                "type": "NoMatch",
                "message": "No speech could be recognized."
            }
        }
    elif recognized_result.reason == speechsdk.ResultReason.Canceled:
        cancellation_details = recognized_result.cancellation_details
        return {
            "error": {
                "type": "Canceled",
                "reason": str(cancellation_details.reason),
                "details": str(cancellation_details.error_details) if cancellation_details.reason == speechsdk.CancellationReason.Error else None
            }
        }

    return None

def main_loop():
    """
    Main application loop handling multiple pronunciation attempts and user interaction
    """
    current_prompt_index = 0

    while True:
        print(f"\nStarting session for prompt {current_prompt_index + 1} of {len(prompts)}")
        reference_text = prompts[current_prompt_index]

        for attempt in range(1, 4):  # Allow 3 attempts per prompt
            # Display prompt for every attempt
            print(f"\nPlease say: \"{reference_text}\"")
            print(f"\nAttempt {attempt} of 3...")
            print("Listening... (Will timeout after 10 seconds if no speech is detected)")
            
            try:
                # Create new recognizer for each attempt
                speech_recognizer = create_speech_recognizer(reference_text)
                result = recognize_and_assess(speech_recognizer, reference_text)
                
                if result is None:
                    print("Session closed due to inactivity. Starting over from prompt 1.")
                    current_prompt_index = 0
                    break
                elif "error" in result:
                    print(f"\nError: {result['error']['message']}")
                    continue
                else:
                    assessment = result["assessment_result"]
                    
                    # Display full JSON results
                    print("\nFull Assessment Results:")
                    print(json.dumps(result, indent=2, ensure_ascii=False))
                    
                    # Display user-friendly summary
                    print(f"\nSummary:")
                    print(f"Recognized text: {assessment['recognized_text']}")
                    print("\nScores:")
                    for score_name, score_value in assessment['scores'].items():
                        print(f"- {score_name}: {score_value}")
                    
                    print("\nWord-by-word analysis:")
                    for word in assessment['words']:
                        print(f"\nWord: {word['word']}")
                        print(f"Accuracy: {word['accuracy_score']}")
                        print("Phonemes:")
                        for phoneme in word['phonemes']:
                            print(f"  - {phoneme['phoneme']}: {phoneme['score']}")
                    
                    if assessment['learning_feedback']:
                        print("\nLearning feedback:")
                        for feedback in assessment['learning_feedback']:
                            print(feedback)
                    
                    # Check if successful
                    if assessment["status"] == "success":
                        print("\nExcellent pronunciation! Moving to the next prompt.")
                        current_prompt_index += 1
                        if current_prompt_index >= len(prompts):
                            print("\n¡Felicitaciones! You've completed all prompts!")
                            return
                        break
                    else:
                        if attempt < 3:  # Only show this message if not the last attempt
                            print("\nLet's try again to improve your pronunciation.")
                        else:
                            print("\nMaximum attempts reached. Moving to the next prompt.")
                            current_prompt_index += 1
                            if current_prompt_index >= len(prompts):
                                print("\n¡Felicitaciones! You've completed all prompts!")
                                return

            except Exception as e:
                print(f"\nError during recognition: {e}")
                continue

        print("\nPress Enter to continue, or type 'exit' to quit.")
        user_input = input()
        if user_input.lower() == 'exit':
            print("\nThank you for practicing Spanish pronunciation!")
            break

if __name__ == "__main__":
    print("Welcome to Spanish Pronunciation Practice!")
    print("This program will help you improve your Spanish pronunciation.")
    print("You'll be given prompts to read aloud, and receive feedback on your pronunciation.")
    print("\nMake sure your microphone is connected and working.")
    print("Press Enter when you're ready to begin, or type 'exit' to quit.")
    
    if input().lower() != 'exit':
        try:
            main_loop()
        except KeyboardInterrupt:
            print("\nProgram interrupted by user. ¡Hasta luego!")
        except Exception as e:
            print(f"\nAn error occurred: {e}")
            print("Please try restarting the program.")
    else:
        print("\n¡Hasta luego!")
