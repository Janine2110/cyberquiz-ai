import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = 3000;

const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "openai/gpt-oss-120b:free";

if (!API_KEY) {
  console.error("Erro: configure OPENROUTER_API_KEY no arquivo .env.");
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/api/status", (req, res) => {
  res.json({
    status: "API local funcionando",
    model: MODEL,
  });
});

app.post("/api/pergunta", async (req, res) => {
  try {
    const { tema } = req.body;

    if (!tema) {
      return res.status(400).json({
        erro: "O tema é obrigatório.",
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-OpenRouter-Title": "CyberQuiz AI",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content:
                "Você é um professor de cibersegurança. Gere apenas uma pergunta curta e objetiva de nível iniciante para estudantes de ADS. A pergunta deve possuir uma resposta principal clara para facilitar a correção.",
            },
            {
              role: "user",
              content: `Crie uma pergunta sobre ${tema}. Retorne somente a pergunta.`,
            },
          ],
          temperature: 0.7,
          max_completion_tokens: 150,
        }),
      }
    );

    if (!response.ok) {
      const detalhe = await response.text();

      return res.status(502).json({
        erro: "Erro ao gerar pergunta.",
        detalhe,
      });
    }

    const data = await response.json();

    const pergunta = data.choices?.[0]?.message?.content;

    if (!pergunta) {
      return res.status(502).json({
        erro: "Pergunta não gerada.",
      });
    }

    res.json({ pergunta });
  } catch (error) {
    res.status(500).json({
      erro: "Erro interno.",
      detalhe: error.message,
    });
  }
});

app.post("/api/corrigir", async (req, res) => {
  try {
    const { tema, pergunta, resposta } = req.body;

    if (!tema || !pergunta || !resposta) {
      return res.status(400).json({
        erro: "Tema, pergunta e resposta são obrigatórios.",
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-OpenRouter-Title": "CyberQuiz AI",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: `
Você é um professor universitário de ADS especializado em cibersegurança.

Avalie a resposta de forma justa e compatível com uma prova de graduação.

Regras de correção:

- Avalie apenas o que foi solicitado na pergunta.
- Não desconte pontos por informações extras que não foram pedidas.
- Se o aluno demonstrar compreensão correta da ideia principal, atribua nota entre 8 e 10.
- Utilize notas entre 5 e 7 apenas quando houver entendimento parcial.
- Utilize notas abaixo de 5 somente quando a resposta estiver incorreta ou demonstrar desconhecimento do assunto.
- Considere sinônimos e explicações equivalentes como válidos.
- Seja rigoroso, mas não excessivamente exigente.
- Não cobre detalhes que não foram solicitados na pergunta.

Retorne exatamente neste formato:

Nota: X/10

Situação:
(Correta, Parcialmente Correta ou Incorreta)

O que acertou:
...

O que faltou:
...

Explicação correta:
...
`,
            },
            {
              role: "user",
              content: `
Tema: ${tema}

Pergunta:
${pergunta}

Resposta do aluno:
${resposta}
`,
            },
          ],
          temperature: 0.5,
          max_completion_tokens: 700,
        }),
      }
    );

    if (!response.ok) {
      const detalhe = await response.text();

      return res.status(502).json({
        erro: "Erro ao corrigir resposta.",
        detalhe,
      });
    }

    const data = await response.json();

    const avaliacao = data.choices?.[0]?.message?.content;

    if (!avaliacao) {
      return res.status(502).json({
        erro: "Avaliação não gerada.",
      });
    }

    res.json({
      avaliacao,
    });
  } catch (error) {
    res.status(500).json({
      erro: "Erro interno.",
      detalhe: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});