import azure.cognitiveservices.speech as speechsdk
import json
import time

# Replace with your actual subscription key and region.
subscription_key = "" # Add the subscription key that I shared with you. If not shared, contact me (Rohan Kamath)
region = "eastus"  # Replace with your region, this works okay though.

# Creates an instance of a speech config with specified subscription key and region.
speech_config = speechsdk.SpeechConfig(subscription=subscription_key, region=region)
speech_config.speech_recognition_language = "en-US"

# Creates an instance of a pronunciation assessment config, using reference text and grading system. We can add more prompted for the game here.
reference_text = "How are you doing?"
pronunciation_assessment_config = speechsdk.PronunciationAssessmentConfig(
    reference_text=reference_text,
    grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
    granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
    enable_miscue=True
)

# Creates a recognizer with the given settings.
audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)
speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

# Apply the pronunciation assessment configuration to the recognizer.
pronunciation_assessment_config.apply_to(speech_recognizer)

# Function to recognize speech and assess pronunciation with a timeout.
def recognize_and_assess():
    print("Initializing...")
    #print("Say 'how are you doing today?' clearly into your microphone.")
    print("Listening... (Will timeout after 15 seconds if no speech is detected)")

    # Set up the speech recognition with a timeout
    done = False
    recognized_result = None

    def stop_cb(evt):
        print('CLOSING on {}'.format(evt))
        nonlocal done
        done = True

    def recognized_cb(evt):
        nonlocal recognized_result
        recognized_result = evt.result
        nonlocal done
        done = True

    # Connect callbacks to the events fired by the speech recognizer
    speech_recognizer.recognizing.connect(lambda evt: print('RECOGNIZING: {}'.format(evt)))
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
    while not done and time.time() - start_time < 15:
        time.sleep(0.1)

    speech_recognizer.stop_continuous_recognition()

    if not recognized_result:
        print("No speech recognized within the timeout period.")
        return

    # Process the result
    if recognized_result.reason == speechsdk.ResultReason.RecognizedSpeech:
        print(f"\nRecognized: {recognized_result.text}")
        print("\nPronunciation Assessment Results:")
        assessment_results = json.loads(recognized_result.properties[speechsdk.PropertyId.SpeechServiceResponse_JsonResult])
        print(json.dumps(assessment_results, indent=2))
    elif recognized_result.reason == speechsdk.ResultReason.NoMatch:
        print("No speech could be recognized.")
    elif recognized_result.reason == speechsdk.ResultReason.Canceled:
        cancellation_details = recognized_result.cancellation_details
        print(f"Speech Recognition canceled: {cancellation_details.reason}")
        if cancellation_details.reason == speechsdk.CancellationReason.Error:
            print(f"Error details: {cancellation_details.error_details}")

# Run the recognition and assessment function.
recognize_and_assess()
