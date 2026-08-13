import express from 'express';
import cors from 'cors';
import {pool} from './db';


const app = express();

app.use(cors());
app.use(express.json());

app.post('/ola', (req, res) => {
    const { nome } = req.body;
    
    res.json({
         mensagem: `Olá, ${nome}!` 
        });
});

app.get("/teste-banco", async (req, res) => {
    try{
        const resultado = await pool.query("SELECT NOW()");

        res.json({mensagem: "Banco conectado com sucesso!",
            horario: resultado.rows[0].now

        });
    }catch (erro) {
        console.error(erro);


        res.status(500).json({
            mensagem: "Erro ao conectar com o banco"
        });
    }    
});

console.log("tipo da senha: ", typeof process.env.DB_PASSWORD);
console.log("Banco:" , process.env.DB_DATABASE);
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});

