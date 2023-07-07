const functions = require('firebase-functions')
const admin = require('firebase-admin')

const express = require('express');
const nodemailer = require('nodemailer')
const cors = require('cors')
const dotenv = require('dotenv')

const app = express()

require('dotenv').config()

app.use(cors({origin: true}))

const { SENDER_EMAIL, SENDER_PASSWORD } = process.env

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: SENDER_EMAIL,
        pass: SENDER_PASSWORD
    }
})

app.post('/sendEmailTakeService', (req, res) => {

    const mailOptions = {
        from: 'testingideb@gmail.com',
        to: 'testingideb@gmail.com',
        subject: 'Tu hoja de horas de servicio esta lista',
        html: `<center><h1>Hola <b>testingideb@gmail.com</b></h1></center>
        El enlace de tu hoja de registro de horas de servicio es el siguiente: <a href="https://fascinating-semolina-29244a.netlify.app/registro/${req.body.id}">https://fascinating-semolina-29244a.netlify.app/registro/${req.body.id}</a>`
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if(error){
            console.error(error);
            res.status(500).send('Error al enviar el correo electrónico');
        } else {
            console.log('Correo electrónico enviado: ');
      res.send('Correo electrónico enviado correctamente');
        }
    })
})

app.post('/sendEmailConfirmReport', (req, res) => {
    const mailOptions = {
        from: 'testingideb@gmail.com',
        to: req.body.email_contacto,
        subject: 'Ahora puedes confirmar tu reporte',
        html: `Tu servicio esta disponible para que lo puedas confirmar, entra a este enlace para confirmar <a href="https://fascinating-semolina-29244a.netlify.app/confirmar/${req.body.id}">aqui</a>`
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if(error){
            console.error(error)
            res.status(500).send('error al enviar el correo')
        } else {
            console.info('Correo enviado')
            res.send('Correo enviado')
        }
    })
})

app.post('/sendEmailConfirmTicket', (req, res) => {
    const mailOptions = {
        from: 'testingideb@gmail.com',
        to: 'testingideb@gmail.com',
        subject: 'El ticket ya esta completado y registrado',
        html: `El ticket del cliente <b>${req.body.nombre_contacto}</b> ya esta completado, lo puedes consultar en este <a href="${req.body.confirmacion.pdf}">PDF</a>`
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if(error){
            console.error(error)
            res.status(500).send('error al enviar el correo')
        } else {
            console.info('Correo enviado')
            res.send('Correo enviado')
        }
    })
})

exports.api = functions.https.onRequest(app);