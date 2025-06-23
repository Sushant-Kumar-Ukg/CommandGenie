# UKG-CO-PILOT

**UKG-CO-PILOT** is a scalable backend service built in **NestJS** that performs:

✅ **Speech-to-Text conversion** using Google Cloud Speech-to-Text or you can directly provide the text 
✅ **Intent detection** from transcribed text using Vertex AI / Gemini  
✅ **Redis Caching**:
✅ **Guardrails enforcement** on model output:
- **PII detection** using Microsoft **Presidio**  
- **Bias detection** using curated **Biasly word lists** and `disallowed-words-checker`

---

## ✨ Features

- Accepts audio files or transcript via API, converts speech to text if required
- Extracts user **intent** and **parameters** from transcribed text using LLMs
- Performs **Guardrails checks** on LLM output:
    - Detects **PII** (email, phone, credit card, SSN, etc.)
    - Detects **Bias** (racial, gender, ableism, etc.)
- Logs warnings for detected PII / Bias
- Modular, scalable architecture
- Presidio runs in **Docker** for easy deployment

---

## 🚀 How to Run the Project

### 1️⃣ Clone the Repo

```bash
Backend :
https://github.com/UKG-Sandbox/Dhruva
Branch : Main

Frontend : 
https://github.com/UKGEPIC/mobile-ukgpro-oneapp
Branch : poc/deepti_changes

### 🛠️ Setup & Run Instructions

#### 1️⃣ Install Dependencies

```bash
pnpm install

#### 2️⃣ Create `.env` File

```env
GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id
VERTEX_LOCATION=us-central1
VERTEX_MODEL=gemini-2.0-flash-001
PRESIDIO_URL=http://127.0.0.1:5001/analyze

#### 3️⃣ Pull Presidio Docker Image

```bash
docker pull mcr.microsoft.com/presidio-analyzer
docker run -d --name presidio-analyzer -p 5001:5001 mcr.microsoft.com/presidio-analyzer

#### 4️⃣ Run redis in your local

#### 5️⃣ Start the Application


```bash
pnpm start:dev





