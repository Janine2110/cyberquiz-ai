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
    const { tema, historico } = req.body;

    if (!tema) {
      return res.status(400).json({ erro: "O tema é obrigatório." });
    }

    const perguntasAnteriores = historico && historico.length > 0 
      ? historico.map((p, i) => `${i + 1}. "${p}"`).join("\n")
      : "Nenhuma pergunta foi feita ainda nesta sessão.";

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
              content: `Você é um professor universitário de cibersegurança para turmas de 3º ao 5º semestre de ADS e Redes de Computadores.
              
Gere uma pergunta curta, direta e de nível intermediário sobre o tema solicitado.

DIRETRIZES IMPORTANTES:
- Se o tema selecionado for "Redes", foque estritamente em Redes de Computadores (protocolos, arquitetura OSI/TCP-IP, roteamento, firewalls, segurança de infraestrutura de rede). Não divague sobre outros tipos de redes.
- REGRA DE INEDITISMO CRÍTICA: Você NUNCA deve repetir ou criar perguntas com escopo e abordagem similares a estas que já foram feitas:
${perguntasAnteriores}

Varie a abordagem técnica, aborde vulnerabilidades diferentes ou use novos cenários para garantir que a pergunta atual seja totalmente inédita.`,
            },
            {
              role: "user",
              content: `Crie uma pergunta inédita sobre o tema: ${tema}. Retorne apenas o texto da pergunta, sem prefixos ou explicações.`,
            },
          ],
          temperature: 0.82,
          max_completion_tokens: 150,
        }),
      }
    );

    if (!response.ok) {
      const detalhe = await response.text();
      return res.status(502).json({ erro: "Erro ao gerar pergunta.", detalhe });
    }

    const data = await response.json();
    const pergunta = data.choices?.[0]?.message?.content;

    if (!pergunta) {
      return res.status(502).json({ erro: "Pergunta não gerada." });
    }

    res.json({ pergunta });
  } catch (error) {
    res.status(500).json({ erro: "Erro interno.", detalhe: error.message });
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
        response_format: { type: "json_object" },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: `Você é um professor universitário especialista em cibersegurança, lecionando para turmas de 3º ao 5º semestre de Análise e Desenvolvimento de Sistemas (ADS) e Redes de Computadores.
              
Avalie a resposta de forma justa e compatível com uma prova técnica de graduação deste nível (intermediário). Caso o tema seja "Redes", exija precisão técnica voltada a Redes de Computadores.

Você DEVE responder UNICAMENTE com um objeto JSON válido. 

Siga estritamente esta estrutura de resposta JSON sem nenhum texto ou caractere por fora:
{
  "nota": "3/10",
  "situacao": "Parcialmente Correta",
  "acertos": "Texto contendo apenas o que o aluno acertou tecnicamente",
  "faltou": "Texto contendo apenas o que faltou ou o que ele errou",
  "explicacao": "A explicação conceitual correta esperada para alunos de ADS/Redes"
}`,
            },
            {
              role: "user",
              content: `Tema: ${tema}\nPergunta: ${pergunta}\nResposta do Aluno: ${resposta}`,
            },
          ],
          temperature: 0.3, 
          max_completion_tokens: 700,
        }),
      }
    );

    if (!response.ok) {
      const detalhe = await response.text();
      return res.status(502).json({ erro: "Erro ao corrigir resposta.", detalhe });
    }

    const data = await response.json();
    const avaliacaoRaw = data.choices?.[0]?.message?.content;

    if (!avaliacaoRaw) {
      return res.status(502).json({ erro: "Avaliação não gerada." });
    }

    let avaliacaoJson;
    
    try {
      avaliacaoJson = JSON.parse(avaliacaoRaw);
    } catch (parseError) {
      const texto = avaliacaoRaw;
      
      const extrairCampo = (padrãoInicio, padrãoFim) => {
        const regex = new RegExp(`${padrãoInicio}.*?:?\\s*([\\s\\S]*?)(?=${padrãoFim}|$)`, 'i');
        const match = texto.match(regex);
        return match ? match[1].trim() : "Não informado";
      };

      avaliacaoJson = {
        nota: extrairCampo("Nota", "Sit"),
        situacao: extrairCampo("Sit", "O que ac"),
        acertos: extrairCampo("O que ac", "O que fa"),
        faltou: extrairCampo("O que fa", "Expli|Expl"),
        explicacao: extrairCampo("Expli|Expl", "FIM_DO_TEXTO")
      };
    }

    const limparPrefixo = (str) => str.replace(/^[^:]+:\s*/i, '');
    
    avaliacaoJson.nota = limparPrefixo(avaliacaoJson.nota);
    avaliacaoJson.situacao = limparPrefixo(avaliacaoJson.situacao);
    avaliacaoJson.acertos = limparPrefixo(avaliacaoJson.acertos);
    avaliacaoJson.faltou = limparPrefixo(avaliacaoJson.faltou);
    avaliacaoJson.explicacao = limparPrefixo(avaliacaoJson.explicacao);

    res.json(avaliacaoJson);
  } catch (error) {
    res.status(500).json({
      erro: "Erro interno na correção.",
      detalhe: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});