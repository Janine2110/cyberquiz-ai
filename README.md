# CyberQuiz AI

## Descrição

O CyberQuiz AI é uma aplicação web desenvolvida para auxiliar estudantes de ADS e Redes de Computadores no aprendizado de conceitos de cibersegurança.

O sistema utiliza um modelo de linguagem (LLM) através da API do OpenRouter para gerar perguntas sobre temas de cibersegurança e corrigir as respostas fornecidas pelo usuário.

## Objetivo

Permitir que estudantes pratiquem conteúdos de cibersegurança por meio de perguntas geradas automaticamente e recebam uma avaliação detalhada de suas respostas.

## Funcionalidades

* Seleção de tema de cibersegurança.
* Geração automática de perguntas utilizando IA.
* Correção automática das respostas.
* Atribuição de nota de 0 a 10.
* Identificação dos acertos.
* Identificação dos pontos que faltaram na resposta.
* Explicação correta do conteúdo.

## Temas Disponíveis

* Phishing
* Criptografia
* Senhas
* Engenharia Social
* Redes de Computadores

## Tecnologias e Recursos

### **Backend**
* **Node.js** — Ambiente de execução JavaScript.
* **Express** — Framework minimalista para criação da API local.
* **Dotenv** — Gerenciamento seguro de variáveis de ambiente.
* **CORS** — Liberação de requisições entre origens diferentes.

### **Frontend**
* **HTML5 & CSS3** — Estrutura e estilização fluida/responsiva (Mobile e Desktop).
* **JavaScript (ES6+)** — Lógica do cliente e consumo assíncrono da API.
* **Fetch API** — Comunicação assíncrona com as rotas do servidor usando `async/await`.
* **Web Audio API** — Sintetização de efeitos sonoros nativos em tempo real.

### **Inteligência Artificial**
* **OpenRouter API** — Integração com o modelo `nvidia/nemotron-3-ultra-550b-a55b:free` para geração e correção de perguntas acadêmicas de cibersegurança.

## Instalação

Clone o repositório:

```bash
git clone https://github.com/Janine2110/cyberquiz-ai.git
```

Acesse a pasta do projeto:

```bash
cd cyberquiz-ai
```

Instale as dependências:

```bash
npm install
```

## Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
OPENROUTER_API_KEY=sua_chave_aqui
```

Substitua `sua_chave_aqui` pela sua chave da API OpenRouter.

## Execução

Inicie o servidor:

```bash
npm start
```

A aplicação estará disponível em:

```text
http://localhost:3000
```

## Estrutura do Projeto

```text
cyberquiz-ai/
│
├── public/
│   ├── index.html
│   └── style.css
│
├── server.js
├── package.json
├── package-lock.json
├── .env
└── README.md
```

## Autor

Janine Veigas Farias

