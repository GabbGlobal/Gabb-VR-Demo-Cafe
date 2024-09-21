import azure.cognitiveservices.speech as speechsdk
import json
import time
import re

# Replace with your actual subscription key and region.
subscription_key = "subscription_key" # Add the subscription key that I shared with you.
region = "eastus"

# these are a list of prompts from the food and drinks v1
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

def create_speech_recognizer(reference_text):
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
    print(f"\nPlease say: \"{reference_text}\"")
    print("Listening... (Will timeout after 10 seconds if no speech is detected)")

    # Set up the speech recognition with a timeout
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

    # Connect callbacks to the events fired by the speech recognizer
    speech_recognizer.recognizing.connect(recognizing_cb)
    speech_recognizer.recognized.connect(recognized_cb)
    speech_recognizer.session_started.connect(lambda evt: print('SESSION STARTED: {}'.format(evt)))
    speech_recognizer.session_stopped.connect(lambda evt: print('SESSION STOPPED {}'.format(evt)))
    speech_recognizer.canceled.connect(lambda evt: print('CANCELED {}'.format(evt)))
    speech_recognizer.session_stopped.connect(stop_cb)
    speech_recognizer.canceled.connect(stop_cb)

    # Start the speech recognition
    speech_recognizer.start_continuous_recognition()

    # Wait for the result with a timeout
    start_time = time.time()
    while not done and time.time() - start_time < 10:
        time.sleep(0.1)

    # if the user didn't say anything for 10 seconds, we ask if they are still there.
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
        
        # Extract relevant scores
        pronunciation_score = assessment_results['NBest'][0]['PronunciationAssessment']['PronScore']
        fluency_score = assessment_results['NBest'][0]['PronunciationAssessment']['FluencyScore']
        completeness_score = assessment_results['NBest'][0]['PronunciationAssessment']['CompletenessScore']
        accuracy_score = assessment_results['NBest'][0]['PronunciationAssessment']['AccuracyScore']

        # Implement custom scoring
        def normalize_text(text):
            return re.sub(r'[^\w\s]', '', text.lower())

        recognized_words = normalize_text(recognized_result.text).split()
        reference_words = normalize_text(reference_text).split()
        
        matched_words = sum(1 for word in recognized_words if word in reference_words)
        word_accuracy = matched_words / len(reference_words)
        length_ratio = min(len(recognized_words), len(reference_words)) / max(len(recognized_words), len(reference_words))

        # this is a score I made up. We can call it Gabb Score or something idk
        custom_score = min(100, 100 * (word_accuracy * 0.7 + length_ratio * 0.3))

        # create a simplified result dictionary
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
            }
        }

        # define threshold for success 
        success_threshold = 95.0

        if custom_score >= success_threshold:
            print("\nPronunciation Assessment Results: Success")
            result["recognition_status"] = "success"
        else:
            print("\nPronunciation Assessment Results: Failure")
            result["error"] = "Recognized text does not match reference text closely enough"

        print(json.dumps(result, indent=2))
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
    current_prompt_index = 0

    while True:
        print(f"\nStarting session for prompt {current_prompt_index + 1} of {len(prompts)}")
        reference_text = prompts[current_prompt_index]

        # basically user gets 3 attempts to say the prompt correctly.
        for attempt in range(1, 4):
            print(f"\nAttempt {attempt} of 3...")
            speech_recognizer = create_speech_recognizer(reference_text)
            result = recognize_and_assess(speech_recognizer, reference_text)
            
            # if result is None, that means the user didn't say anything for 10 seconds.
            if result is None:
                print("Session closed due to inactivity. Starting over from prompt 1.")
                current_prompt_index = 0
                break

            # if result["recognition_status"] == "failure", that means the user said something but it was incorrect.
            elif result["recognition_status"] == "failure":
                print("Failure detected. Trying again.")
                if attempt == 3:
                    print(f"Failed 3 times. Going back to prompt 1.")
                    current_prompt_index = 0
                    break

            # if result["recognition_status"] == "success", that means the user said the prompt correctly.
            else:
                print("Success! Moving to the next prompt.")
                current_prompt_index += 1
                if current_prompt_index >= len(prompts):
                    print("Congratulations! You've completed all prompts.")
                    return
                break

        # user can press enter to continue or type exit to quit.
        print("\nPress Enter to continue, or type 'exit' to quit.")
        user_input = input()
        if user_input.lower() == 'exit':
            break

# Run the main loop
main_loop()