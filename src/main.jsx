import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

const questions = [
  ['polyuria', 'Do you urinate unusually frequently?', 'Increased urination'],
  ['polydipsia', 'Do you experience excessive thirst?', 'Excessive thirst'],
  ['sudden_weight_loss', 'Have you experienced sudden or unexplained weight loss?', 'Sudden weight loss'],
  ['weakness', 'Do you frequently feel unusually weak or tired?', 'Weakness'],
  ['polyphagia', 'Do you experience excessive hunger?', 'Excessive hunger'],
  ['genital_thrush', 'Have you experienced genital itching or thrush?', 'Genital thrush'],
  ['visual_blurring', 'Have you experienced blurred vision?', 'Blurred vision'],
  ['itching', 'Do you frequently experience itching?', 'Itching'],
  ['irritability', 'Have you been more irritable than usual?', 'Irritability'],
  ['delayed_healing', 'Do cuts or wounds seem to take unusually long to heal?', 'Delayed healing'],
  ['partial_paresis', 'Have you experienced unusual weakness or reduced movement in part of your body?', 'Partial paresis'],
  ['muscle_stiffness', 'Do you experience unusual muscle stiffness?', 'Muscle stiffness'],
  ['alopecia', 'Have you experienced noticeable hair loss?', 'Hair loss'],
  ['obesity', 'Would you describe yourself as overweight/obese?', 'Obesity']
];

const initialForm = {
  age: '',
  gender: '',
  ...Object.fromEntries(questions.map(([key]) => [key, '']))
};

function App() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();

    setError('');

    if (!n8nWebhookUrl) {
      setError('The n8n webhook URL is not configured.');
      return;
    }

    try {
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const result = await response.json();

      console.log('n8n response:', result);

      setResult(result);
      setSubmitted(true);

    } catch (error) {
      console.error('FULL ERROR:', error);
      setError(error.message);
    }
  };

  const reset = () => {
    setForm(initialForm);
    setSubmitted(false);
    setResult(null);
    setError('');
  };

  return (
    <main className="page">
      <section className="hero">
        <div className="badge">EARLY RISK SCREENING</div>

        <h1>Understand your diabetes risk.</h1>

        <p>
          Answer a few simple questions about your age and symptoms.
          No medical tests are required for this questionnaire.
        </p>
      </section>

      <form className="card" onSubmit={submit}>

        <div className="section">
          <h2>About you</h2>

          <div className="grid two">

            <label>
              Age

              <input
                type="number"
                min="1"
                max="120"
                value={form.age}
                onChange={e => update('age', e.target.value)}
                placeholder="e.g. 24"
                required
              />
            </label>

            <label>
              Gender

              <select
                value={form.gender}
                onChange={e => update('gender', e.target.value)}
                required
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>

          </div>

          
        </div>

        <div className="section">

          <h2>Symptoms & signs</h2>

          <p className="section-note">
            Select Yes or No for each question.
          </p>

          <div className="questions">

            {questions.map(([key, text, short]) => (

              <div className="question" key={key}>

                <div>
                  <strong>{text}</strong>
                  <span>{short}</span>
                </div>

                <div className="choice-row compact">

                  {['Yes', 'No'].map(v => (

                    <button
                      type="button"
                      className={
                        form[key] === v
                          ? 'choice active'
                          : 'choice'
                      }
                      onClick={() => update(key, v)}
                      key={v}
                      aria-pressed={form[key] === v}
                    >
                      {v}
                    </button>

                  ))}

                </div>

              </div>

            ))}

          </div>
        </div>

        <div className="notice">
          <strong>Important:</strong> This project is a screening tool,
          not a medical diagnosis. The final model result should be used
          only as an indication of whether professional medical testing
          may be worth considering.
        </div>

        {error && (
          <div className="result">
            <h2>Something went wrong</h2>
            <p>{error}</p>
          </div>
        )}

        {!submitted ? (

          <button
            className="submit"
            type="submit"
            disabled={
              !form.age ||
              !form.gender ||
              questions.some(([k]) => !form[k])
            }
          >
            Check my risk
          </button>

        ) : (

          <div className="result">

            <div className="result-icon">✓</div>

            <h2>
              {result?.risk === 'Higher'
                ? 'Higher Risk'
                : 'Lower Risk'}
            </h2>

            <p>
              {result?.message}
            </p>

            <button
              className="secondary"
              type="button"
              onClick={reset}
            >
              Start again
            </button>

          </div>

        )}

      </form>

      <footer>
        Educational project • Not a medical diagnosis
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);