def main():
    print("Hello from tts-coqui!")
    # Init TTS with the target model name
    tts = TTS(model_name="tts_models/de/thorsten/tacotron2-DDC", progress_bar=False).to(device)

    # Run TTS
    tts.tts_to_file(text="Ich bin eine Testnachricht.", file_path=OUTPUT_PATH)

    # Example voice cloning with YourTTS in Korean.
    tts = TTS(model_name="tts_models/multilingual/multi-dataset/your_tts", progress_bar=False).to(device)
    tts.tts_to_file("This is voice cloning.", speaker_wav="my/cloning/audio.wav", language="en", file_path="output.wav")
    tts.tts_to_file("C'est le clonage de la voix.", speaker_wav="my/cloning/audio.wav", language="fr-fr", file_path="output.wav")
    tts.tts_to_file("Isso é clonagem de voz.", speaker_wav="my/cloning/audio.wav", language="pt-br", file_path="output.wav")


if __name__ == "__main__":
    main()
