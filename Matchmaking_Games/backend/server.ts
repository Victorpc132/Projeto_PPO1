import express from "express";
import cors from "cors";
import { pool } from "./db";
import { password } from "bun";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/ola", (req, res) => {
  const { nome } = req.body;

  res.json({
    mensagem: `Olá, ${nome}!`,
  });
});

app.get("/teste-banco", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT NOW()");

    res.json({
      mensagem: "Banco conectado com sucesso!",
      horario: resultado.rows[0].now,
    });
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao conectar com o banco",
    });
  }
});

app.post("/usuarios", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    const senhaHash = await password.hash(senha);

    const resultado = await pool.query(
      `
            INSERT INTO usuarios (nome, email, senha)
            VALUES ($1, $2, $3)
            RETURNING id, nome, email
            `,
      [nome, email, senhaHash],
    );

    res.status(201).json({
      mensagem: "Usuário criado com sucesso!",
      usuario: resultado.rows[0],
    });
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      mensagem: "Erro ao criar usuário",
    });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
