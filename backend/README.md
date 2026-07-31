# DICALI — Backend (API)

API REST de **DICALI** construida con **Spring Boot 3.2.3** y **Java 17**, con persistencia en
**MongoDB**. Provee la autenticación (JWT), los perfiles de candidato y empresa, las vacantes, el
**motor de matching ponderado** y la explicación de cada match con un LLM local (Ollama, opcional).

> Parte del Proyecto de Grado de **Marco Rodolfo Cortez**. Ver el [README principal](../README.md).

## Requisitos

- **Java 17+** y **Maven**
- **MongoDB** corriendo localmente en `mongodb://localhost:27017/job_portal_db`
- *(Opcional)* **Ollama** (`gemma3:1b`) para las explicaciones con IA

## Configuración

El `application.properties` real está en `.gitignore` porque contiene secretos. Copia la plantilla y
completa `jwt.secret` (y, si usas correo, las credenciales de mail):

```bash
cp src/main/resources/application.properties.example src/main/resources/application.properties
```

Propiedades relevantes:

- `matching.weights.*` — pesos de los criterios de ajuste y piso del filtro de afinidad vocacional
  (`affinity-floor`).
- `ollama.*` — configuración del LLM local (`ollama.enabled=false` lo desactiva por completo).

## Ejecución

```bash
mvn spring-boot:run     # API en http://localhost:8080
mvn test                # ejecuta las pruebas
mvn package             # genera el .jar
```

> Si tras cambios ves errores raros de arranque (seguridad por defecto o "0 repositorios"), ejecuta
> `mvn clean` antes de volver a levantar: limpia clases compiladas obsoletas en `target/`.

## Estructura

Paquete raíz: `com.mahmudalam.jobportal.spring_boot_job_portal_app`.

- **`security/`** — `SecurityConfig`, `JwtAuthFilter`, `JwtUtil`. Define qué endpoints son públicos y
  cuáles requieren autenticación o rol `ADMIN`.
- **`model/`** — documentos de MongoDB: `UserModel`, `CandidateProfileModel`, `CompanyProfileModel`,
  `VacancyModel`, `MatchModel` (y `MatchBreakdown`, un `record` de apoyo para la explicación).
- **`repository/`** — interfaces `MongoRepository` (Spring Data).
- **`service/`** — `AuthService`, **`MatchingEngine`** (score ponderado + filtro de afinidad vocacional),
  `OllamaService` (cliente a prueba de fallos) y `MatchExplanationService` (explicación on-demand cacheada
  con respaldo determinístico).
- **`controller/`** — `AuthController` (`/api/auth`), `CandidateProfileController`
  (`/api/candidate-profiles`), `CompanyProfileController` (`/api/company-profiles`), `VacancyController`
  (`/api/vacancies`), `MatchController` (`/api/matches`, incluye `GET /{id}/explanation` y el reporte del
  reclutador) y `AdminController` (`/api/admin`).

## Documentación de la API

Con el backend corriendo, Swagger UI está en `http://localhost:8080/swagger-ui.html`.
