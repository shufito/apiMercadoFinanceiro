const express = require("express");
const yahooFinance = require("yahoo-finance2").default;

const app = express();
const PORT = 3000;

// Suprimir mensagens de aviso da API do Yahoo Finance
yahooFinance.suppressNotices(["yahooSurvey"]);

// Endpoint para buscar dados de um ticket
app.get("/api/cotacao/:ticker", async (req, res) => {
  const ticker = req.params.ticker;

  try {
    const resultado = await yahooFinance.quote(ticker);
    const dadosSimplificados = {
      ticker: resultado.symbol,
      nome: resultado.longName,
      precoAtual: resultado.regularMarketPrice,
      variacaoPercentual: resultado.regularMarketChangePercent,
      dividendYield: resultado.dividendYield,
      precoMin52Semanas: resultado.fiftyTwoWeekLow,
      precoMax52Semanas: resultado.fiftyTwoWeekHigh,
      volumeMedio: resultado.averageDailyVolume3Month,
      moeda: resultado.currency,
    };

    res.status(200).json(dadosSimplificados);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ erro: "Não foi possível buscar a cotação." });
  }
});

// Endpoint para buscar historico de um ticket
app.get("/api/historico/:ticker", async (req, res) => {
  const ticker = req.params.ticker;
  const { intervalo = "1d", inicio, fim } = req.query;

  const tickerFormatado = ticker.endsWith(".SA") ? ticker : `${ticker}.SA`;

  try {
    // Validar as datas de início e fim
    if (!inicio || !fim) {
      return res.status(400).json({
        erro: 'Os parâmetros "inicio" e "fim" são obrigatórios no formato YYYY-MM-DD.',
      });
    }

    const period1 = new Date(inicio).getTime() / 1000; // Converter para timestamp Unix
    const period2 = new Date(fim).getTime() / 1000; // Converter para timestamp Unix

    if (isNaN(period1) || isNaN(period2)) {
      return res
        .status(400)
        .json({ erro: "Datas inválidas. Use o formato YYYY-MM-DD." });
    }

    // Chamada à função `chart`
    const historico = await yahooFinance.chart(tickerFormatado, {
      interval: intervalo,
      period1, // Data de início (em segundos Unix)
      period2, // Data de fim (em segundos Unix)
    });

    res.status(200).json(historico);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    res.status(500).json({
      erro: "Não foi possível buscar o histórico de preços.",
      detalhes: error.message,
    });
  }
});

// Endpoint para buscar ticket usando palavras-chave
app.get("/api/busca", async (req, res) => {
  const { termo } = req.query;

  if (!termo) {
    return res.status(400).json({ erro: 'O parâmetro "termo" é obrigatório.' });
  }

  try {
    const resultados = await yahooFinance.search(termo);
    res.status(200).json(resultados);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ erro: "Não foi possível realizar a busca." });
  }
});

// Endpoint para buscar informações do ticket.
app.get("/api/sumario/:ticker", async (req, res) => {
  const ticker = req.params.ticker;

  try {
    const dividendos = await yahooFinance.quoteSummary(ticker, {
      modules: [
        "summaryDetail",
        "summaryProfile",
        "financialData",
        "incomeStatementHistory",
        "cashflowStatementHistory",
      ],
    });
    res.status(200).json(dividendos);
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ erro: "Não foi possível buscar os dados de dividendos." });
  }
});

// Endpoint para buscar informações para gerar graficos do ticket.
app.get("/api/grafico/:ticker", async (req, res) => {
  const ticker = req.params.ticker;

  const { inicio, fim } = req.query;

  const period1 = new Date(inicio).getTime() / 1000; // Converter para timestamp Unix
  const period2 = new Date(fim).getTime() / 1000; // Converter para timestamp Unix

  if (isNaN(period1) || isNaN(period2)) {
    return res
      .status(400)
      .json({ erro: "Datas inválidas. Use o formato YYYY-MM-DD." });
  }

  try {
    const dividendos = await yahooFinance.historical(ticker, {
      period1,
      period2,
    });
    res.status(200).json(dividendos);
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ erro: "Não foi possível buscar os dados de dividendos." });
  }
});

// Endpoint retorna informações gerais sobre o mercado financeiro.
app.get("/api/mercado", async (req, res) => {
  try {
    // Exemplo de índice global (S&P 500)
    const dadosSP500 = await yahooFinance.quote("^GSPC"); // S&P 500

    // Exemplo de índice brasileiro (IBOV)
    const dadosIBOV = await yahooFinance.quote("^BVSP"); // IBOVESPA

    res.status(200).json({
      sp500: dadosSP500,
      ibov: dadosIBOV,
    });
  } catch (error) {
    console.error("Erro ao buscar dados de mercado:", error.message);
    res
      .status(500)
      .json({ erro: "Não foi possível buscar os dados de mercado." });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
