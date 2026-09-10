# Diabetes Risk Screening

An educational machine-learning application for early diabetes risk screening. A user completes a short questionnaire in the React frontend, and the trained Flask API returns a `Higher` or `Lower` screening result.

> **Medical disclaimer:** This project is not a medical diagnostic system. Its output must not be treated as a diagnosis or a substitute for professional medical advice or testing.

## What This Project Contains

- **React + Vite frontend**: questionnaire and result display.
- **Flask API**: validates input, prepares model features, and returns a prediction.
- **Logistic Regression model**: stored in `model/diabetes_risk_model.pkl`.
- **Jupyter notebook**: training and experimentation history in `diabetes_risk_model.ipynb`.
- **Optional n8n integration**: the current frontend submits to an n8n webhook, which can call the Flask API and return the result.

## Architecture

```text
User
	|
	v
React + Vite --> n8n webhook --> Flask /predict --> trained model
											 |                  |
											 +-- result <-------+
```

The Flask API can also be used directly without n8n.

## Prerequisites

- Node.js and npm
- Python 3.10 or newer
- A virtual environment is recommended for the API
- n8n and ngrok are optional and only needed for the hosted workflow

## Quick Start: Frontend

From the project root:

```bash
npm install
npm run dev
```

Create a local `.env` file from the example and set the n8n webhook URL:

```bash
cp .env.example .env
```

Then edit `.env`:

```env
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.example/webhook-test/diabetes-risk
```

The `.env` file is ignored by Git. Never commit your real webhook URL or other private configuration.

Open the local URL printed by Vite, normally `http://localhost:5173`.

To create a production build:

```bash
npm run build
npm run preview
```

## Run the Flask API

Create and activate a Python virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install the API dependencies:

```bash
python -m pip install flask joblib pandas scikit-learn
```

Start the API from the project root:

```bash
python api/app.py
```

The API listens on `http://127.0.0.1:5000`.

Health check:

```bash
curl http://127.0.0.1:5000/
```

Expected response:

```json
{
	"status": "ok",
	"message": "Diabetes Risk Prediction API is running."
}
```

## Test the Prediction API

The `/predict` endpoint accepts a JSON `POST` request. All 16 fields are required:

```bash
curl -X POST http://127.0.0.1:5000/predict \
	-H "Content-Type: application/json" \
	-d '{
		"age": 45,
		"gender": "Male",
		"polyuria": "Yes",
		"polydipsia": "Yes",
		"sudden_weight_loss": "No",
		"weakness": "Yes",
		"polyphagia": "No",
		"genital_thrush": "No",
		"visual_blurring": "No",
		"itching": "No",
		"irritability": "No",
		"delayed_healing": "No",
		"partial_paresis": "No",
		"muscle_stiffness": "No",
		"alopecia": "No",
		"obesity": "Yes"
	}'
```

Successful responses contain:

```json
{
	"risk": "Higher",
	"probability": 0.8734,
	"message": "..."
}
```

Accepted values:

- `age`: integer from 1 to 120
- `gender`: `Male` or `Female`
- Every symptom field: `Yes` or `No`

## n8n Integration

The frontend sends questionnaire data to the n8n webhook URL configured by `VITE_N8N_WEBHOOK_URL` in the local `.env` file. The intended workflow is:

1. Receive the questionnaire with an n8n Webhook node.
2. Send the data to `POST /predict` with an HTTP Request node.
3. Optionally send the result through another node, such as Gmail.
4. Return the API response with Respond to Webhook.

For a local Flask server, n8n Cloud needs a public HTTPS tunnel. A typical development flow is:

```bash
ngrok http 5000
```

Use the generated HTTPS URL as the base URL for the n8n HTTP Request node. Do not commit private webhook URLs, credentials, OAuth tokens, or real user responses. The frontend currently contains a test webhook URL, so replace it before deploying or sharing this application publicly.

## Dataset and Model

The model is based on the [UCI Early Stage Diabetes Risk Prediction Dataset](https://archive.ics.uci.edu/dataset/529/early+stage+diabetes+risk+prediction+dataset).

The model uses age, gender, and 14 symptom/sign features. Human-readable inputs are encoded before prediction:

- `Female` = `0`, `Male` = `1`
- `No` = `0`, `Yes` = `1`

The generated model artifacts are:

- `model/diabetes_risk_model.pkl`
- `model/feature_order.pkl`

The notebook contains the model-training workflow and analysis. Do not place real patient information in the notebook, API logs, documentation, or test payloads.

## Project Structure

```text
.
├── api/app.py                         # Flask prediction API
├── model/diabetes_risk_model.pkl      # Trained model
├── model/feature_order.pkl            # Model feature order
├── diabetes_risk_model.ipynb          # Training notebook
├── src/main.jsx                       # React application
├── src/styles.css                     # Frontend styles
├── index.html                         # Vite entry page
├── package.json                       # Frontend scripts and dependencies
└── .gitignore                         # Local files and secret patterns
```

## Security and Privacy

Before publishing or deploying this project:

- Never commit `.env` files, API keys, passwords, private keys, webhook secrets, or OAuth tokens.
- Never commit real patient or questionnaire data.
- Keep Flask debug mode disabled outside local development.
- Add authentication and rate limiting before exposing the API publicly.
- Treat submitted health information as sensitive data and avoid logging request bodies.
- Replace test webhook configuration with deployment-specific configuration.

The repository ignores local environments, dependency folders, caches, raw datasets, logs, and common secret-file patterns. Ignoring a file does not remove a secret that was already committed; rotate any credential that was ever exposed.

## Troubleshooting

### Frontend cannot submit

Check that `.env` contains `VITE_N8N_WEBHOOK_URL`, then restart the Vite development server. Also confirm that the n8n webhook is active and that its workflow can reach the Flask API. If using n8n Cloud with a local API, start an ngrok tunnel and update the n8n HTTP Request URL.

### API returns `Missing required fields`

Confirm that the request contains all 16 fields listed in the API section and that the JSON field names match exactly.

### API cannot load the model

Run the API from the project root so the relative model path resolves correctly:

```bash
python api/app.py
```

### Frontend dependencies are missing

Reinstall them locally:

```bash
npm install
```

## License and Attribution

This repository is an educational project. Dataset attribution and usage details are available from the [UCI dataset page](https://archive.ics.uci.edu/dataset/529/early+stage+diabetes+risk+prediction+dataset).
