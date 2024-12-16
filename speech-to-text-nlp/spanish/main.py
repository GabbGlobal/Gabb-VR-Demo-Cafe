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
        'default': 'k',
        'e': 'θ',       # Spain Spanish before e/i
        'i': 'θ',       # Spain Spanish before e/i
        'e_latam': 's', # Latin American Spanish before e/i
        'i_latam': 's'  # Latin American Spanish before e/i
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
    }
}

# List of prompts
prompts = [
    "Hola, ¿puedo ver el menú por favor?",
    "Quiero un café con leche, por favor.",
    "Sí, me gustaría un sándwich de huevo.",
    "¿Qué tipo de muffin es ese?",
    "No, gracias, no hoy.",
    "¿Puedo pagar con tarjeta?",
    "Bien, aquí está. Aquí están $6.",
    "¡Gracias!"
]

def get_spanish_phonemes(word, dialect='spain'):
    """
    Convert a Spanish word to its IPA representation with comprehensive phonetic rules
    Args:
        word (str): The word to convert
        dialect (str): 'spain' or 'latam' for different regional pronunciations
    """
    phonemes = []
    i = 0
    word = word.lower()
    vowels = 'aeiouáéíóú'
    
    def is_vowel(char):
        return char in vowels
    
    def get_next_chars(pos, count=1):
        return word[pos:pos + count] if pos + count <= len(word) else ''
    
    def get_prev_char(pos):
        return word[pos - 1] if pos > 0 else ''
    
    while i < len(word):
        # Check for three-character combinations first
        three_chars = get_next_chars(i, 3)
        if three_chars in ['güe', 'güi']:
            phonemes.append({
                'Phoneme': SPANISH_IPA[three_chars],
                'PronunciationAssessment': {'AccuracyScore': 100.0},
                'Position': 'middle'
            })
            i += 3
            continue
        
        # Check for two-character combinations
        two_chars = get_next_chars(i, 2)
        if two_chars in ['ch', 'll', 'rr', 'gu', 'qu']:
            if two_chars in ['gu', 'qu']:
                next_char = get_next_chars(i + 2, 1)
                if next_char in 'eéií':
                    phoneme = 'g' if two_chars == 'gu' else 'k'
                    phonemes.append({
                        'Phoneme': phoneme,
                        'PronunciationAssessment': {'AccuracyScore': 100.0},
                        'Position': 'middle'
                    })
                    i += 3
                    continue
            
            phoneme = SPANISH_IPA[two_chars]
            if isinstance(phoneme, dict):
                phoneme = phoneme[dialect] if dialect in phoneme else phoneme['default']
            
            phonemes.append({
                'Phoneme': phoneme,
                'PronunciationAssessment': {'AccuracyScore': 100.0},
                'Position': 'middle'
            })
            i += 2
            continue
        
        # Handle single characters with context
        char = word[i]
        next_char = get_next_chars(i + 1, 1)
        prev_char = get_prev_char(i)
        
        # Handle context-dependent consonants
        if char in ['b', 'd', 'g', 'v']:
            if i == 0 or prev_char in 'mn':  # word-initial or after nasal
                phoneme = SPANISH_IPA[char]['initial']
            elif prev_char and is_vowel(prev_char):  # intervocalic
                phoneme = SPANISH_IPA[char]['intervocalic']
            else:
                phoneme = SPANISH_IPA[char]['default']
        
        # Handle 'n' before velar consonants
        elif char == 'n' and next_char in 'kg':
            phoneme = SPANISH_IPA['n']['velar']
        
        # Handle 'c' with following vowel
        elif char == 'c' and next_char in 'eéií':
            phoneme = SPANISH_IPA['c']['e_latam' if dialect == 'latam' else 'e']
        
        # Handle 'r' in different positions
        elif char == 'r':
            if i == 0:  # word-initial
                phoneme = SPANISH_IPA['r']['initial']
            elif prev_char and is_vowel(prev_char) and next_char and is_vowel(next_char):  # intervocalic
                phoneme = SPANISH_IPA['r']['intervocalic']
            elif i == len(word) - 1:  # word-final
                phoneme = SPANISH_IPA['r']['final']
            else:
                phoneme = SPANISH_IPA['r']['default']
        
        # Handle regular characters
        else:
            phoneme = SPANISH_IPA.get(char, char)
            if isinstance(phoneme, dict):
                phoneme = phoneme.get('default', '')
        
        if phoneme:  # Only add if not empty
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

def recognize_and_assess(speech_recognizer, reference_text):
    """
    Perform speech recognition and pronunciation assessment with detailed phoneme analysis
    """
    print(f"\nPlease say: \"{reference_text}\"")
    print("Listening... (Will timeout after 10 seconds if no speech is detected)")

    done = False
    recognized_result = None
    speech_detected = False

    def stop_cb(evt):
        print('CLOSING on {}'.format(evt))
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
    speech_recognizer.session_started.connect(lambda evt: print('SESSION STARTED: {}'.format(evt)))
    speech_recognizer.session_stopped.connect(lambda evt: print('SESSION STOPPED {}'.format(evt)))
    speech_recognizer.canceled.connect(lambda evt: print('CANCELED {}'.format(evt)))
    speech_recognizer.session_stopped.connect(stop_cb)
    speech_recognizer.canceled.connect(stop_cb)

    speech_recognizer.start_continuous_recognition()

    start_time = time.time()
    while not done and time.time() - start_time < 10:
        time.sleep(0.1)

    if not speech_detected and not done:
        print("\nAre you still there?")
        while not done and time.time() - start_time < 20:
            time.sleep(0.1)

    speech_recognizer.stop_continuous_recognition()

    if not recognized_result:
        print("No speech recognized within the timeout period.")
        return None

    if recognized_result.reason == speechsdk.ResultReason.RecognizedSpeech:
        print(f"\nRecognized: {recognized_result.text}")
        try:
            assessment_results = json.loads(
                recognized_result.properties[speechsdk.PropertyId.SpeechServiceResponse_JsonResult]
            )
            
            # Extract pronunciation assessment scores
            pronunciation_assessment = assessment_results['NBest'][0].get('PronunciationAssessment', {})
            pronunciation_score = pronunciation_assessment.get('PronScore', 0)
            fluency_score = pronunciation_assessment.get('FluencyScore', 0)
            completeness_score = pronunciation_assessment.get('CompletenessScore', 0)
            accuracy_score = pronunciation_assessment.get('AccuracyScore', 0)

            # Get Azure's recognized words
            azure_words = assessment_results['NBest'][0].get('Words', [])
            
            # Process reference text into words
            reference_words = reference_text.lower().replace('¿', '').replace('?', '').replace(',', '').replace('.', '').split()
            reference_word_assessments = []

            # Process each reference word
            for ref_word in reference_words:
                # Get expected IPA phonemes for reference word
                ipa_phonemes = get_spanish_phonemes(ref_word, dialect='spain')
                
                # Find if this word was recognized by Azure
                matching_word = next(
                    (w for w in azure_words if w['Word'].lower() == ref_word.lower()),
                    None
                )
                
                if matching_word:
                    # Word was pronounced - use Azure scores
                    azure_phonemes = matching_word.get('Phonemes', [])
                    combined_phonemes = []
                    
                    for i, ipa_phoneme in enumerate(ipa_phonemes):
                        score = 0.0  # default score for unmatched phonemes
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
                    # Word was not pronounced - zero scores
                    combined_phonemes = [{
                        'Phoneme': p['Phoneme'],
                        'PronunciationAssessment': {
                            'AccuracyScore': 0.0
                        }
                    } for p in ipa_phonemes]
                    word_accuracy = 0.0
                    error_type = 'Omission'
                
                word_data = {
                    'word': ref_word,
                    'accuracy_score': word_accuracy,
                    'error_type': error_type,
                    'phonemes': combined_phonemes
                }
                reference_word_assessments.append(word_data)

            # Calculate custom score based on reference text
            total_expected_phonemes = sum(len(w['phonemes']) for w in reference_word_assessments)
            total_phoneme_score = sum(
                p['PronunciationAssessment']['AccuracyScore']
                for w in reference_word_assessments
                for p in w['phonemes']
            )
            custom_score = total_phoneme_score / total_expected_phonemes if total_expected_phonemes > 0 else 0

            # Create result dictionary
            result = {
                "recognition_status": "failure",
                "recognized_text": recognized_result.text,
                "reference_text": reference_text,
                "scores": {
                    "pronunciation_score": pronunciation_score,
                    "fluency_score": fluency_score,
                    "completeness_score": completeness_score,
                    "accuracy_score": accuracy_score,
                    "custom_score": custom_score
                },
                "words_assessment": reference_word_assessments
            }

            # Determine success based on threshold
            success_threshold = 90.0
            if custom_score >= success_threshold:
                print("\nPronunciation Assessment Results: Success")
                result["recognition_status"] = "success"
            else:
                print("\nPronunciation Assessment Results: Failure")
                result["error"] = "Pronunciation does not match reference text closely enough"

            # Print detailed results
            print("\nDetailed Assessment Results:")
            print("\nScores:")
            print(f"  Pronunciation: {pronunciation_score:.1f}")
            print(f"  Fluency: {fluency_score:.1f}")
            print(f"  Completeness: {completeness_score:.1f}")
            print(f"  Accuracy: {accuracy_score:.1f}")
            print(f"  Custom Score: {custom_score:.1f}")
            
            print("\nWord Assessments:")
            for word_assess in reference_word_assessments:
                print(f"\nWord: {word_assess['word']}")
                print(f"Accuracy: {word_assess['accuracy_score']:.1f}")
                print(f"Error Type: {word_assess['error_type']}")
                print("Phonemes:")
                for phoneme in word_assess['phonemes']:
                    print(f"  {phoneme['Phoneme']} "
                          f"(Score: {phoneme['PronunciationAssessment']['AccuracyScore']:.1f})")

            return result

        except json.JSONDecodeError as e:
            print(f"Error parsing assessment results: {e}")
            return None
        except KeyError as e:
            print(f"Error accessing assessment data: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error during assessment: {e}")
            return None

    elif recognized_result.reason == speechsdk.ResultReason.NoMatch:
        print("No speech could be recognized.")
    elif recognized_result.reason == speechsdk.ResultReason.Canceled:
        cancellation_details = recognized_result.cancellation_details
        print(f"Speech Recognition canceled: {cancellation_details.reason}")
        if cancellation_details.reason == speechsdk.CancellationReason.Error:
            print(f"Error details: {cancellation_details.error_details}")

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
            print(f"\nAttempt {attempt} of 3...")
            
            try:
                # Create new recognizer for each attempt
                speech_recognizer = create_speech_recognizer(reference_text)
                result = recognize_and_assess(speech_recognizer, reference_text)
                
                if result is None:
                    print("Session closed due to inactivity. Starting over from prompt 1.")
                    current_prompt_index = 0
                    break
                elif result["recognition_status"] == "failure":
                    print("\nLet's analyze what went wrong:")
                    print("1. Check your pronunciation of these specific words:")
                    for word_assess in result["words_assessment"]:
                        if word_assess["accuracy_score"] < 90:
                            print(f"   - {word_assess['word']}: Score {word_assess['accuracy_score']:.1f}")
                            print("     Correct phonemes:", end=" ")
                            print(", ".join([p["Phoneme"] for p in word_assess["phonemes"]]))
                    
                    if attempt == 3:
                        print(f"\nWe'll try a different prompt. Going back to prompt 1.")
                        current_prompt_index = 0
                        break
                    print("\nTry again, focusing on these words.")
                else:
                    print("\nExcellent pronunciation! Moving to the next prompt.")
                    current_prompt_index += 1
                    if current_prompt_index >= len(prompts):
                        print("\n¡Felicitaciones! You've completed all prompts!")
                        print("Your Spanish pronunciation practice session is complete.")
                        return
                    break

            except Exception as e:
                print(f"\nError during recognition: {e}")
                print("Let's try again.")
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
