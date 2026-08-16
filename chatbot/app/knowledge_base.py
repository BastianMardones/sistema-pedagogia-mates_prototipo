"""
knowledge_base.py — Base de conocimiento para el chatbot pedagógico.

Usa FAISS para búsqueda semántica eficiente sobre:
1. Formato oficial de planificación de clase
2. Criterios de evaluación del tutor
3. Guías de DUA (Diseño Universal para el Aprendizaje)
4. Rúbricas de observación de clase

El vector store se construye al iniciar el servicio y se puede
actualizar sin reiniciar (recarga incremental).
"""

import os
import json
from pathlib import Path
from typing import Optional

KNOWLEDGE_BASE_TEXT = """
# FORMATO OFICIAL DE PLANIFICACIÓN DE CLASE — Pedagogía en Matemáticas

## Elementos OBLIGATORIOS (elementos mínimos que debe tener toda planificación)

### 1. Encabezado
- Establecimiento educacional
- Nivel y curso (ej: 1° Medio A)
- Asignatura: Matemática / Orientación
- Fecha de la clase
- Duración (ej: 90 minutos)
- Nombre del estudiante en práctica

### 2. Objetivo de Aprendizaje (OA)
- Debe estar alineado con el Programa de Estudios del MINEDUC
- Debe ser observable y medible
- Usar verbos concretos: recordar, comprender, aplicar, analizar, evaluar, crear
- Ejemplo correcto: "Resolver problemas que involucren fracciones equivalentes, utilizando representaciones concretas, pictóricas y simbólicas"
- Ejemplo incorrecto: "Aprender fracciones" (muy vago)

### 3. Habilidad principal
- Debe corresponder a la taxonomía de Bloom
- Niveles: Recordar < Comprender < Aplicar < Analizar < Evaluar < Crear
- Justificar por qué ese nivel de habilidad para ESE curso

### 4. Recursos didácticos
- Lista específica de materiales
- No solo "PPT" — describir qué contiene el PPT
- Guía de trabajo (adjuntar como documento separado)
- Material manipulativo si aplica

### 5. Instrumento de evaluación
- Especificar el tipo: rúbrica, pauta de cotejo, lista de cotejo, escala de apreciación
- El instrumento debe estar adjunto como documento separado

### 6. Los TRES MOMENTOS de la clase (OBLIGATORIOS)

#### INICIO (15-20 minutos)
Debe incluir:
- Activación de conocimientos previos
- Presentación del objetivo en lenguaje accesible para los estudiantes
- Motivación/contexto de la clase
- Qué hace el PROFESOR y qué hacen los ESTUDIANTES (separado)

#### DESARROLLO (50-60 minutos)
Debe incluir:
- Secuencia didáctica detallada paso a paso
- Tipo de agrupamiento: individual, parejas, grupos
- Rol del profesor (facilitador, monitor, etc.)
- Actividades de los estudiantes
- Posibles preguntas detonadoras

#### CIERRE (10-15 minutos)
Debe incluir:
- Síntesis de la clase
- Evaluación formativa de logros
- Conexión con próxima clase
- Tarea (si aplica)

### 7. DUA — Diseño Universal para el Aprendizaje
Principios que deben aplicarse por cada momento:

**Principio 1: Múltiples formas de REPRESENTACIÓN**
- ¿Cómo presento el contenido de distintas maneras?
- Visual, auditivo, kinestésico
- Vocabulario clave explicitado

**Principio 2: Múltiples formas de ACCIÓN Y EXPRESIÓN**
- ¿Cómo pueden los estudiantes demostrar su aprendizaje?
- No solo escrito — oral, gráfico, manipulativo

**Principio 3: Múltiples formas de PARTICIPACIÓN Y MOTIVACIÓN**
- ¿Qué estrategias mantienen el interés?
- Relevancia personal del contenido
- Gestión del esfuerzo y persistencia

### 8. PIE — Adaptaciones para Proyecto de Integración Escolar
Para cada estudiante con NEE declarada en el curso:

**NEE Transitorias** (más comunes):
- Dislexia: material con fuente grande, lectura en voz alta, más tiempo
- Discalculia: material concreto, calculadora permitida, pasos explícitos
- TEA leve: instrucciones claras y directas, anticipar cambios de actividad
- TDA/TDAH: actividades más cortas, refuerzo positivo frecuente

**NEE Permanentes**:
- Discapacidad intelectual leve: contenido adaptado, evaluación diferenciada
- Discapacidad visual: material ampliado o en braille

**Alumnos extranjeros** sin dominio del español:
- Glosario visual de términos matemáticos
- Instrucciones en su idioma si es posible

### 9. Dificultades anticipadas y estrategias de resolución
- ¿Qué conceptos suelen ser confusos para los estudiantes?
- ¿Qué preguntas frecuentes pueden surgir?
- ¿Cómo reorientar si la actividad no funciona?

## CRITERIOS DE EVALUACIÓN DEL CHATBOT

### Nivel de evaluación de la planificación:
- **MUY BUENA**: Todos los elementos presentes, objetivo claro, DUA completo, coherencia entre momentos
- **BUENA**: La mayoría de elementos presentes, algunas áreas de mejora menores
- **REGULAR**: Faltan elementos importantes o hay incoherencias entre secciones
- **INSUFICIENTE**: Faltan elementos mínimos obligatorios, objetivo vago, sin DUA

### Coherencia interna (importante):
- ¿El objetivo es coherente con lo que se hace en inicio, desarrollo y cierre?
- ¿El instrumento de evaluación mide realmente el objetivo?
- ¿Las adaptaciones PIE responden a las características reales del curso?
- ¿La secuencia didáctica es progresiva en complejidad?

## NIVELES DE ESTUDIANTE EN PRÁCTICA

### INICIAL (Práctica 1-2: Aproximación y Ambientes de Aprendizaje)
- No se evalúa DUA completo (aún no han cursado Inclusión)
- Planificación más simple, sin los 3 momentos completos
- Solo objetivo, recursos básicos, descripción general de actividad
- El chatbot es más tolerante y más formativo

### INTERMEDIO (Práctica 3-4: Trabajo Colaborativo, Investigación en el Aula)
- Se trabaja en duplas
- DUA básico requerido (principio 1 como mínimo)
- Los 3 momentos obligatorios pero sin mucho detalle en cierre

### AVANZADO (Práctica 5-6: Pedagógica y Profesional — el estudiante es profesor titular)
- Todos los elementos obligatorios
- DUA completo por cada momento
- PIE con adaptaciones específicas por estudiante
- Dificultades anticipadas obligatorias
- Se espera alta calidad y autonomía pedagógica
"""


def create_knowledge_base():
    """
    Crea el vector store FAISS con la base de conocimiento pedagógico.
    Retorna un retriever de LangChain.
    """
    try:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        from langchain_community.vectorstores import FAISS
        from langchain.text_splitter import RecursiveCharacterTextSplitter

        # Dividir el texto en chunks para mejor búsqueda
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=100,
            separators=["\n## ", "\n### ", "\n#### ", "\n\n", "\n", " "]
        )
        chunks = splitter.create_documents([KNOWLEDGE_BASE_TEXT])

        # Embeddings con Gemini
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=os.getenv("GOOGLE_API_KEY")
        )

        # FAISS vector store
        vectorstore = FAISS.from_documents(chunks, embeddings)

        # Guardar en disco para no reconstruir cada vez
        vectorstore.save_local("data/faiss_index")

        return vectorstore.as_retriever(search_kwargs={"k": 4})

    except Exception as e:
        # Si FAISS falla, usar fallback sin vector store
        print(f"[WARN] No se pudo inicializar FAISS: {e}. Usando modo sin RAG.")
        return None


def load_or_create_knowledge_base():
    """Carga el vector store desde disco o lo crea si no existe."""
    index_path = Path("data/faiss_index")

    if index_path.exists():
        try:
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            from langchain_community.vectorstores import FAISS

            embeddings = GoogleGenerativeAIEmbeddings(
                model="models/text-embedding-004",
                google_api_key=os.getenv("GOOGLE_API_KEY")
            )
            vectorstore = FAISS.load_local(
                str(index_path), embeddings,
                allow_dangerous_deserialization=True
            )
            return vectorstore.as_retriever(search_kwargs={"k": 4})
        except Exception as e:
            print(f"[WARN] Error cargando FAISS existente: {e}. Reconstruyendo...")

    return create_knowledge_base()
