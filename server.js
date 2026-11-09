require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const app = express();
app.use(cors());
app.use(express.json());
const youtube = google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_API_KEY
});
app.get("/", (req, res) => {
    res.json({
        mensagem: "Servidor GORDO DOWNLOAD funcionando!"
    });
});
app.get("/api/youtube", async (req, res) => {
    try {
        const link = req.query.url;

        if (!link) {
            return res.status(400).json({
                erro: "Informe o link do YouTube."
            });
        }
        const parsed = new URL(link);
        let videoId = "";

        if (parsed.hostname.includes("youtu.be")) {
            videoId = parsed.pathname.substring(1);
        } else if (parsed.hostname.includes("youtube.com")) {
            videoId = parsed.searchParams.get("v") ||
                parsed.pathname.split("/")[2];
        }
        if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
            return res.status(400).json({
                erro: "Link do YouTube inválido."
            });
        }
        const resultado = await youtube.videos.list({
            part: ["snippet", "contentDetails", "statistics"],
            id: [videoId]
        });

        const video = resultado.data.items?.[0];
        if (!video) {
            return res.status(404).json({
                erro: "Vídeo não encontrado."
            });
        }
        res.json({
            titulo: video.snippet.title,
            canal: video.snippet.channelTitle,
            descricao: video.snippet.description,
            capa: video.snippet.thumbnails.high?.url ||
                  video.snippet.thumbnails.default?.url,
            publicado: video.snippet.publishedAt,
            duracao: video.contentDetails.duration,
            visualizacoes: video.statistics?.viewCount || "0"
        });
    } catch (erro) {
        console.error(erro.message);

        res.status(500).json({
            erro: "Não foi possível consultar o YouTube."
        });
    }
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`GORDO DOWNLOAD rodando na porta ${PORT}`);
});
