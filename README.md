# DICALI — Plataforma de Reclutamiento Inteligente

DICALI es un portal de empleo full-stack que conecta **candidatos** con **empresas** mediante un
**motor de matching ponderado** y explica cada resultado en lenguaje natural usando un **modelo de
lenguaje local (Ollama)**. Cuentas por rol con autenticación JWT real, CV estructurado, vacantes con
requisitos detallados y exportación del CV a PDF.

## Características

- **Autenticación real (JWT)** con tres roles: `CANDIDATE`, `RECRUITER`, `ADMIN` (contraseñas con
  bcrypt y recuperación por pregunta de seguridad).
- **CV estructurado del candidato**: experiencia laboral con fechas, educación, habilidades técnicas
  (con nivel), habilidades blandas, idiomas (A1–C2/Nativo), certificaciones, expectativa salarial y
  disponibilidad. Exportable a **PDF** desde el navegador.
- **Vacantes**: habilidades técnicas requeridas (con nivel), habilidades blandas, idiomas requeridos,
  certificaciones deseadas, años mínimos de experiencia, rango salarial y modalidad.
- **Motor de matching ponderado y configurable** (6 criterios): técnicas 55%, blandas 20%,
  experiencia 10%, salario 5%, modalidad 5%, idiomas 5%. Los pesos se ajustan por configuración sin
  recompilar. El score se calcula de forma **determinística** (reproducible).
- **Explicación del match con IA local (opcional)**: un LLM (Ollama, `gemma3:1b`) redacta *por qué* un
  candidato encaja con una vacante. Si Ollama no está disponible, se usa una explicación de respaldo
  determinística — la app funciona igual. **El LLM solo redacta; nunca calcula el score.**
- **Panel de administración**: estadísticas y gestión de usuarios, vacantes, perfiles y empresas.

## Stack

| Capa      | Tecnología |
|-----------|------------|
| Backend   | Java 17, Spring Boot 3.2.3, Spring Security + JWT, Spring Data MongoDB |
| Base de datos | MongoDB (local) |
| Frontend  | React + Vite, React Router, Zustand, Tailwind CSS v4, Axios, jsPDF |
| IA (opcional) | Ollama con el modelo `gemma3:1b` |

## Requisitos

- **Java 17+** y Maven
- **Node.js + npm**
- **MongoDB** corriendo localmente en `mongodb://localhost:27017`
- *(Opcional)* **Ollama** para las explicaciones con LLM real:
  ```bash
  ollama pull gemma3:1b
  ```
  En Windows/Mac, Ollama arranca solo como servicio (no necesitas `ollama serve`).

## Instalación y ejecución

### 1. Backend (desde `backend/`)

```bash
# Copiar la plantilla de configuración y completar los secretos (jwt.secret, etc.)
cp src/main/resources/application.properties.example src/main/resources/application.properties

mvn spring-boot:run          # API en http://localhost:8080
```

Otros comandos: `mvn test` (tests), `mvn package` (jar).

> El `application.properties` real está en `.gitignore` porque contiene secretos. La plantilla
> `application.properties.example` trae valores por defecto que funcionan; solo debes reemplazar
> `jwt.secret` (y, si usas correo, las credenciales de mail).

### 2. Frontend (desde `frontend/`)

```bash
npm install
npm run dev                  # Vite en http://localhost:5173
```

Otros comandos: `npm run build` (build de producción), `npm run lint` (ESLint).

## Cómo usar

1. Entra a `http://localhost:5173` y regístrate como **candidato** o **empresa**.
2. **Candidato** → *Mi Currículum*: llena tu CV estructurado (incluye idiomas y certificaciones).
   En *Empleos* ves las vacantes con tu **% de compatibilidad** y el botón *"¿Por qué este match?"*.
3. **Empresa** → *Mi Empresa* (registra tus datos) y luego *Reclutar* (crea vacantes). En *Postulantes*
   ves a los candidatos rankeados por compatibilidad, con su explicación.

## Documentación de la API

Con el backend corriendo, Swagger UI está en `http://localhost:8080/swagger-ui.html`.
Endpoints principales: `/api/auth`, `/api/candidate-profiles`, `/api/company-profiles`,
`/api/vacancies`, `/api/matches` (incluye `GET /api/matches/{id}/explanation`), `/api/admin`.

## Arquitectura (resumen)

- **Matching**: `service/MatchingEngine` calcula un score ponderado 0–100 por 6 criterios; persiste un
  `MatchModel` por par candidato–vacante. Pesos vía `matching.weights.*`.
- **IA**: `service/OllamaService` (cliente a prueba de fallos — nunca rompe el matching) +
  `service/MatchExplanationService` (genera la explicación on-demand, la cachea en el `MatchModel` y cae
  al respaldo determinístico si el LLM no responde).
- Ver [CLAUDE.md](CLAUDE.md) para el detalle de modelos, controladores y servicios.
