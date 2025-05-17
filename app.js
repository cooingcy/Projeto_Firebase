const express = require("express");
const app = express();
const handlebars = require("express-handlebars").engine;
const handlebarsHelper = require("handlebars");
const bodyParser = require("body-parser");
const {
  initializeApp,
  applicationDefault,
  cert,
} = require("firebase-admin/app");
const {
  getFirestore,
  Timestamp,
  FieldValue,
} = require("firebase-admin/firestore");

require('dotenv').config();

const serviceAccount = require(process.env.FIREBASE_KEY_PATH);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

app.engine("handlebars", handlebars({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", function (req, res) {
  res.render("primeira_pagina");
});

app.get("/consulta", async function (req, res) {
  try {
    const snapshot = await db.collection("agendamentos").get();
    const agendamentos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.render("consulta", { agendamentos });
  } catch (err) {
    console.log("Erro ao buscar agendamentos: " + err);
    res.send("Erro ao buscar agendamentos.");
  }
});

// Rota para carregar os dados de um agendamento específico e permitir edição
app.get("/editar/:id", async function (req, res) {
  try {
    const doc = await db.collection("agendamentos").doc(req.params.id).get();

    if (!doc.exists) {
      return res.send("Agendamento não encontrado.");
    }

    res.render("editar", { agendamento: { id: doc.id, ...doc.data() } });
  } catch (error) {
    res.send("Erro ao buscar agendamento: " + error);
  }
});

// Rota para atualizar um agendamento com base no ID
app.post("/atualizar", async function (req, res) {
  console.log("Dados recebidos para atualizar:", req.body); // debug

  const id = req.body.id;
  if (!id) {
    return res
      .status(400)
      .send("ID do agendamento não foi enviado ou está vazio");
  }

  try {
    await db.collection("agendamentos").doc(id).update({
      nome: req.body.nome,
      telefone: req.body.telefone,
      origem: req.body.origem,
      data_contato: req.body.data_contato,
      observacao: req.body.observacao,
    });
    res.redirect("/consulta");
  } catch (error) {
    res.status(500).send("Erro ao atualizar agendamento: " + error);
  }
});

// Rota para excluir um agendamento com base no ID
app.get("/excluir/:id", async function (req, res) {
  try {
    await db.collection("agendamentos").doc(req.params.id).delete();
    res.redirect("/consulta");
  } catch (error) {
    res.send("Erro ao excluir agendamento: " + error);
  }
});

app.post("/cadastrar", function (req, res) {
  var result = db
    .collection("agendamentos")
    .add({
      nome: req.body.nome,
      telefone: req.body.telefone,
      origem: req.body.origem,
      data_contato: req.body.data_contato,
      observacao: req.body.observacao,
    })
    .then(function () {
      console.log("Added document");
      res.redirect("/");
    });
});

handlebarsHelper.registerHelper("eq", function (a, b) {
  return a === b;
});

app.listen(8081, function () {
  console.log("Servidor ativo!");
});
