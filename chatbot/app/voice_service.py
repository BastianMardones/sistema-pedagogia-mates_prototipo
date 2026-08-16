"""
voice_service.py — Servicio de transcripción de notas de voz para observaciones de clase.

Arquitectura escalable con patrón Strategy:
- Provider 1: Google Cloud Speech-to-Text (recomendado para producción)
- Provider 2: OpenAI Whisper API (buena calidad, precio razonable)
- Provider 3: Whisper local (gratis, funciona sin internet — para desarrollo)

El servicio detecta automáticamente qué provider usar según las variables de entorno.
Para la demo/Sprint 1: usa Whisper local (ya instalado).
Para producción (Sprint 3/servidor Pacheco): cambiar a Google Speech-to-Text.
"""

import os
import io
import time
import tempfile
import subprocess
from abc import ABC, abstractmethod
from typing import Optional
from dataclasses import dataclass


@dataclass
class TranscripcionResult:
    texto: str
    duracion_segundos: float
    proveedor: str
    idioma: str = "es"
    confianza: Optional[float] = None


# ============================================================
# Interfaz base (Strategy Pattern)
# ============================================================
class SpeechProvider(ABC):
    @abstractmethod
    def transcribir(self, audio_path: str) -> TranscripcionResult:
        pass

    @abstractmethod
    def nombre(self) -> str:
        pass


# ============================================================
# Provider 1: Whisper Local (para desarrollo y demo)
# ============================================================
class WhisperLocalProvider(SpeechProvider):
    def __init__(self, model_size: str = "small"):
        self._model = None
        self.model_size = model_size

    def _get_model(self):
        if self._model is None:
            import whisper
            self._model = whisper.load_model(self.model_size)
        return self._model

    def transcribir(self, audio_path: str) -> TranscripcionResult:
        start = time.time()
        model = self._get_model()

        result = model.transcribe(audio_path, language="es", fp16=False)
        duracion = time.time() - start

        return TranscripcionResult(
            texto=result["text"].strip(),
            duracion_segundos=duracion,
            proveedor="whisper-local",
        )

    def nombre(self) -> str:
        return "whisper-local"


# ============================================================
# Provider 2: Google Cloud Speech-to-Text (producción)
# ============================================================
class GoogleSpeechProvider(SpeechProvider):
    def __init__(self, credentials_path: Optional[str] = None):
        self.credentials_path = credentials_path or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

    def transcribir(self, audio_path: str) -> TranscripcionResult:
        try:
            from google.cloud import speech
        except ImportError:
            raise RuntimeError("google-cloud-speech no instalado. Ejecuta: pip install google-cloud-speech")

        start = time.time()
        client = speech.SpeechClient()

        with open(audio_path, "rb") as f:
            content = f.read()

        audio = speech.RecognitionAudio(content=content)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
            sample_rate_hertz=48000,
            language_code="es-CL",
            enable_automatic_punctuation=True,
            model="latest_long",
        )

        response = client.recognize(config=config, audio=audio)
        texto = " ".join([r.alternatives[0].transcript for r in response.results])
        confianza = response.results[0].alternatives[0].confidence if response.results else None

        return TranscripcionResult(
            texto=texto.strip(),
            duracion_segundos=time.time() - start,
            proveedor="google-speech",
            confianza=confianza,
        )

    def nombre(self) -> str:
        return "google-speech"


# ============================================================
# Provider 3: OpenAI Whisper API (alternativa cloud)
# ============================================================
class OpenAIWhisperProvider(SpeechProvider):
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")

    def transcribir(self, audio_path: str) -> TranscripcionResult:
        try:
            import openai
        except ImportError:
            raise RuntimeError("openai no instalado. Ejecuta: pip install openai")

        start = time.time()
        client = openai.OpenAI(api_key=self.api_key)

        with open(audio_path, "rb") as f:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                language="es",
                response_format="verbose_json"
            )

        return TranscripcionResult(
            texto=response.text.strip(),
            duracion_segundos=time.time() - start,
            proveedor="openai-whisper",
        )

    def nombre(self) -> str:
        return "openai-whisper"


# ============================================================
# Factory — selecciona provider automáticamente
# ============================================================
class VoiceServiceFactory:
    """
    Selecciona el mejor provider disponible según la configuración.
    Prioridad: Google Speech > OpenAI Whisper > Whisper Local
    """
    @staticmethod
    def create() -> SpeechProvider:
        if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") and os.path.exists(
            os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
        ):
            try:
                import google.cloud.speech
                return GoogleSpeechProvider()
            except ImportError:
                pass

        if os.getenv("OPENAI_API_KEY"):
            try:
                import openai
                return OpenAIWhisperProvider()
            except ImportError:
                pass

        # Fallback: Whisper local
        return WhisperLocalProvider(model_size=os.getenv("WHISPER_MODEL", "small"))


# ============================================================
# Servicio principal de voz (singleton-like)
# ============================================================
class VoiceService:
    def __init__(self):
        self._provider: Optional[SpeechProvider] = None
        self._capcut_ffmpeg = r"C:\Users\Antonio\AppData\Local\CapCut\Apps\5.1.0.1897\ffmpeg.exe"

    def _get_provider(self) -> SpeechProvider:
        if self._provider is None:
            self._provider = VoiceServiceFactory.create()
        return self._provider

    def _convertir_a_wav(self, audio_path: str) -> str:
        """Convierte cualquier formato de audio a WAV 16kHz mono para Whisper."""
        output_path = audio_path.rsplit(".", 1)[0] + "_converted.wav"

        # Buscar ffmpeg
        ffmpeg_paths = [
            "ffmpeg",  # Si está en PATH
            self._capcut_ffmpeg,
            r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        ]

        ffmpeg_bin = None
        for path in ffmpeg_paths:
            try:
                result = subprocess.run([path, "-version"],
                                        capture_output=True, timeout=5)
                if result.returncode == 0:
                    ffmpeg_bin = path
                    break
            except (FileNotFoundError, subprocess.TimeoutExpired):
                continue

        if not ffmpeg_bin:
            raise RuntimeError("ffmpeg no encontrado. Necesario para convertir audio.")

        subprocess.run([
            ffmpeg_bin, "-y", "-i", audio_path,
            "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le",
            output_path
        ], capture_output=True, check=True)

        return output_path

    async def transcribir_nota_voz(
        self,
        audio_bytes: bytes,
        formato: str = "webm",
        evaluacion_id: Optional[int] = None
    ) -> TranscripcionResult:
        """
        Transcribe una nota de voz grabada desde el navegador.

        Args:
            audio_bytes: Bytes del archivo de audio
            formato: Formato del audio (webm, mp4, ogg, wav)
            evaluacion_id: ID de la evaluación asociada (para logging)
        """
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=f".{formato}"
        ) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            # Convertir a WAV si es necesario
            if formato not in ("wav",):
                wav_path = self._convertir_a_wav(tmp_path)
            else:
                wav_path = tmp_path

            provider = self._get_provider()
            result = provider.transcribir(wav_path)

            return result
        finally:
            # Limpiar archivos temporales
            import os
            for path in [tmp_path]:
                if os.path.exists(path):
                    os.unlink(path)

    def get_provider_name(self) -> str:
        return self._get_provider().nombre()


# Singleton global
voice_service = VoiceService()
