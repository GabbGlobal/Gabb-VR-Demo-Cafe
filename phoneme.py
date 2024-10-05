import azure.cognitiveservices.speech as speechsdk
import json
import time
import re

# Replace with your actual subscription key and region.
subscription_key = ""  # Replace with your actual subscription key.
region = "eastus"  # Replace with your service region.

# List of prompts from the food and drinks v1
prompts = [
    "Hi, May I see the menu please?",
    "I want a coffee with milk please.",
    "Yes, I would like an egg sandwich.",
    "What kind of muffin is that?",
    "No thanks, not today.",
    "Can I pay by card?",
    "Okay, here you go. Here's $6.",
    "Thank you!"
]

# ARPABET to IPA Mapping for better readability (optional)
ARPABET_MAPPING = {
    "AA": "ɑ",
    "AE": "æ",
    "AH": "ʌ",
    "AO": "ɔ",
    "AW": "aʊ",
    "AY": "aɪ",
    "B": "b",
    "CH": "tʃ",
    "D": "d",
    "DH": "ð",
    "EH": "ɛ",
    "ER": "ɝ",
    "EY": "eɪ",
    "F": "f",
    "G": "ɡ",
    "HH": "h",
    "IH": "ɪ",
    "IY": "i",
    "JH": "dʒ",
    "K": "k",
    "L": "l",
    "M": "m",
    "N": "n",
    "NG": "ŋ",
    "OW": "oʊ",
    "OY": "ɔɪ",
    "P": "p",
    "R": "ɹ",
    "S": "s",
    "SH": "ʃ",
    "T": "t",
    "TH": "θ",
    "UH": "ʊ",
    "UW": "u",
    "V": "v",
    "W": "w",
    "Y": "j",
    "Z": "z",
    "ZH": "ʒ"
}

def map_phoneme(arpabet):
    """Map ARPABET phonemes to IPA symbols for better readability."""
    return ARPABET_MAPPING.get(arpabet, arpabet)

def create_speech_recognizer(reference_text):
    """Create and configure a SpeechRecognizer with Pronunciation Assessment."""
    speech_config = speechsdk.SpeechConfig(subscription=subscription_key, region=region)
    speech_config.speech_recognition_language = "en-US"
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
    """Recognize speech, assess pronunciation, and provide phoneme-level feedback."""
    print(f"\nPlease say: \"{reference_text}\"")
    print("Listening... (Will timeout after 10 seconds if no speech is detected)")

    # Set up the speech recognition with a timeout
    done = False
    recognized_result = None
    speech_detected = False

    def stop_cb(evt):
        """Callback to stop recognition."""
        print('CLOSING on {}'.format(evt))
        nonlocal done
        done = True

    def recognized_cb(evt):
        """Callback when speech is recognized."""
        nonlocal recognized_result
        recognized_result = evt.result
        nonlocal done
        done = True

    def recognizing_cb(evt):
        """Callback when speech is being recognized."""
        nonlocal speech_detected
        speech_detected = True

    # Connect callbacks to the events fired by the speech recognizer
    speech_recognizer.recognizing.connect(recognizing_cb)
    speech_recognizer.recognized.connect(recognized_cb)
    speech_recognizer.session_started.connect(lambda evt: print('SESSION STARTED'))
    speech_recognizer.session_stopped.connect(lambda evt: print('SESSION STOPPED'))
    speech_recognizer.canceled.connect(lambda evt: print('CANCELED: {}'.format(evt.reason)))
    speech_recognizer.session_stopped.connect(stop_cb)
    speech_recognizer.canceled.connect(stop_cb)

    # Start the speech recognition
    speech_recognizer.start_continuous_recognition()

    # Wait for the result with a timeout
    start_time = time.time()
    while not done and time.time() - start_time < 10:
        time.sleep(0.1)

    # If the user didn't say anything for 10 seconds, ask if they are still there.
    if not speech_detected and not done:
        print("\nAre you still there?")
        while not done and time.time() - start_time < 20:
            time.sleep(0.1)

    speech_recognizer.stop_continuous_recognition()

    if not recognized_result:
        print("No speech recognized within the timeout period.")
        return None

    # Process the result
    if recognized_result.reason == speechsdk.ResultReason.RecognizedSpeech:
        print(f"\nRecognized: {recognized_result.text}")
        assessment_results = json.loads(recognized_result.properties[speechsdk.PropertyId.SpeechServiceResponse_JsonResult])

        # **DEBUG: Print the entire assessment_results**
        print("\nFull Assessment JSON:")
        print(json.dumps(assessment_results, indent=2))

        # Continue with existing processing...
        # Extract overall scores
        pron_assessment = assessment_results['NBest'][0]['PronunciationAssessment']
        pronunciation_score = pron_assessment.get('PronScore', 0)
        fluency_score = pron_assessment.get('FluencyScore', 0)
        completeness_score = pron_assessment.get('CompletenessScore', 0)
        accuracy_score = pron_assessment.get('AccuracyScore', 0)

        # Extract phoneme-level assessments
        phoneme_assessments = pron_assessment.get('PhonemeAssessment', [])

        phoneme_details = []
        for phoneme in phoneme_assessments:
            phoneme_text = phoneme.get('Phoneme', '')
            score = phoneme.get('Score', 0)
            miscues = phoneme.get('MiscueType', 'None')
            phoneme_details.append({
                "phoneme": phoneme_text,
                "score": score,
                "miscue": miscues
            })

        # Implement custom scoring
        def normalize_text(text):
            return re.sub(r'[^\w\s]', '', text.lower())

        recognized_words = normalize_text(recognized_result.text).split()
        reference_words = normalize_text(reference_text).split()

        matched_words = sum(1 for word in recognized_words if word in reference_words)
        word_accuracy = matched_words / len(reference_words) if reference_text else 0
        length_ratio = min(len(recognized_words), len(reference_words)) / max(len(recognized_words), len(reference_words)) if max(len(recognized_words), len(reference_words)) > 0 else 0

        custom_score = min(100, 100 * (word_accuracy * 0.7 + length_ratio * 0.3))

        # Create a simplified result dictionary
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
            "phoneme_assessments": phoneme_details  # Add phoneme details here
        }

        # Define threshold for success 
        success_threshold = 95.0

        if custom_score >= success_threshold:
            print("\nPronunciation Assessment Results: Success")
            result["recognition_status"] = "success"
        else:
            print("\nPronunciation Assessment Results: Failure")
            result["error"] = "Recognized text does not match reference text closely enough"

        # Print overall scores
        print(json.dumps(result, indent=2))

        # Print phoneme-level feedback
        if phoneme_details:
            print("\nPhoneme-Level Feedback:")
            for idx, phoneme in enumerate(phoneme_details, start=1):
                mapped_phoneme = map_phoneme(phoneme['phoneme'])
                phoneme_status = "Correct" if phoneme['score'] >= 90 else "Needs Improvement"
                print(f"Phoneme {idx}: {phoneme['phoneme']} ({mapped_phoneme})")
                print(f"  Score: {phoneme['score']} - {phoneme_status}")
                if phoneme['miscue'] != "None":
                    print(f"  Miscue Type: {phoneme['miscue']}")
                print()
        else:
            print("\nPhoneme-Level Feedback: No phoneme assessments available.")

        return result
    elif recognized_result.reason == speechsdk.ResultReason.NoMatch:
        print("No speech could be recognized.")
    elif recognized_result.reason == speechsdk.ResultReason.Canceled:
        cancellation_details = recognized_result.cancellation_details
        print(f"Speech Recognition canceled: {cancellation_details.reason}")
        if cancellation_details.reason == speechsdk.CancellationReason.Error:
            print(f"Error details: {cancellation_details.error_details}")

    return None




def main_loop():
    """Main loop to iterate through prompts and assess user pronunciation."""
    current_prompt_index = 0

    while True:
        print(f"\nStarting session for prompt {current_prompt_index + 1} of {len(prompts)}")
        reference_text = prompts[current_prompt_index]

        # User gets 3 attempts to say the prompt correctly.
        for attempt in range(1, 4):
            print(f"\nAttempt {attempt} of 3...")
            speech_recognizer = create_speech_recognizer(reference_text)
            result = recognize_and_assess(speech_recognizer, reference_text)
            
            # If the user didn't say anything for 10 seconds, reset to first prompt.
            if result is None:
                print("Session closed due to inactivity. Starting over from prompt 1.")
                current_prompt_index = 0
                break

            # If the recognition failed, try again up to 3 attempts.
            elif result["recognition_status"] == "failure":
                print("Failure detected. Trying again.")
                if attempt == 3:
                    print(f"Failed 3 times. Going back to prompt 1.")
                    current_prompt_index = 0
                    break

            # If the recognition succeeded, move to the next prompt.
            else:
                print("Success! Moving to the next prompt.")
                current_prompt_index += 1
                if current_prompt_index >= len(prompts):
                    print("Congratulations! You've completed all prompts.")
                    return
                break

        # User can press Enter to continue or type 'exit' to quit.
        print("\nPress Enter to continue, or type 'exit' to quit.")
        user_input = input()
        if user_input.lower() == 'exit':
            print("Exiting the pronunciation assessment. Goodbye!")
            break

# Run the main loop
if __name__ == "__main__":
    main_loop()
