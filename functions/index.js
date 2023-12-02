const functions = require('firebase-functions')
const admin = require('firebase-admin')

const express = require('express');
const nodemailer = require('nodemailer')
const cors = require('cors')
const dotenv = require('dotenv')
const cron = require('node-cron')

const app = express()

require('dotenv').config()

// Permitir el acceso a la API de todos los origenes
app.use(cors({origin: true}))

// Extraer los datos que hay en el archivo .env del proyecto
const { SENDER_EMAIL, SENDER_PASSWORD } = process.env

// JSON en el que se tienen todas las credenciales de firebase para su uso
const serviceAccount = require('./test-web-app-8b605-firebase-adminsdk-h4zfp-b1159df6ea.json');

// Inicializar las credenciales ante Firebase para usar su servicio
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

// Iniciar el sevicio de firestore para poder extraer las colecciones que hay en Firestore
const db = admin.firestore()

//Recuperar el nombre de los documentos en el que estan guardados
const reporte = db.collection('reportes')

// Transporter en el que se establecen los valores de autenticación ante Google para usar su servicio de correo
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: SENDER_EMAIL,
        pass: SENDER_PASSWORD
    }
})

// Función para mandar un correo para recordarle al usuario que tiene su ticket abierto
function reminderConfirmationEmail(id, email) {
    const mailMessage = {
        from: 'capitalhumano.ideb@gmail.com',
        to: email,
        subject: `Recordatorio para completar su servicio`,
        html: `<p>Su hoja de servicion con el id: <b>${id}</b> sigue abierto para que pueda confirmar que su servicio se llevo con exito</p>
        <p>Este es el link de su hoja de confirmación: <a href="https://loquacious-eclair-9dba40.netlify.app/confirmar/${id}">https://loquacious-eclair-9dba40.netlify.app/confirmar/${id}</p>`
    }

    transporter.sendMail(mailMessage, (error, info) => {
        if(error){
            console.error(error)
            res.status(500).send('Email no enviado')
        } else {
            console.log('Correo electrónico enviado: ');
            res.send('Correo electrónico enviado correctamente');
        }
    })
}

// Tarea que se ejecuta en el servidor cada 8 horas para ver si todos los usuarios ya cerraron sus tickets de reporte 
cron.schedule('0 */8 * * *', () => {
    reporte.get()
    .then(( querySnapshot ) => {
        querySnapshot.forEach(( doc ) => {
            const data = doc.data()
            const hasServicio = Object.prototype.hasOwnProperty.call(data, 'servicio');
            const hasConfirmacion = Object.prototype.hasOwnProperty.call(data, 'confirmacion');

            if(hasServicio && !hasConfirmacion) reminderConfirmationEmail(data.id ,data.email_contacto)
        })
    })
})

// Endpoint para mandar correo a los empleados de IDEB que se dedican a darle seguimiento a los servicios para que les mande el link de su hoja de registro 
app.post('/sendEmailTakeService', (req, res) => {

    const mailOptions = {
        from: 'capitalhumano.ideb@gmail.com',
        to: 'technical.support@idebmexico.com',
        subject: 'Tu hoja de horas de servicio esta lista',
        html: `<center><h1>Hola <b>technical.support@idebmexico.com</b></h1></center>
        <br>Los datos del servicio son los siguientes: <br>
        <b>Nombre del contacto: </b>${req.body.nombre_contacto}<br>
        <b>Nombre de la empresa: </b>${req.body.nombre_empresa}<br>
        <b>Email del contacto: </b>${req.body.email_contacto}<br>
        <b>Nombre del contacto: </b>${req.body.nombre_contacto}<br>
        <b>Area de trabajo del contacto: </b>${req.body.nombre_contacto}<br>
        <b>Telefono del contacto: </b>${req.body.telefono_contacto}<br>
        <b>Ubicación de la empresa: </b>${req.body.ubicacion_empresa}<br>
        <br>
        Datos de la maquina:
        <br>
        <b>Nombre de la maquina: </b>${req.body.falla_maquina}<br>
        <b>Numero de la maquina: </b>${req.body.numero_maquina}<br>
        <b>Descripcion de la falla de la maquina: </b>${req.body.descripcion_falla_maquina}<br>
        <b>Información de ayuda para maquina: </b>${req.body.informacion_ayuda_maquina}<br>
        <b>Nombre del contacto: </b>${req.body.nombre_contacto}<br>
        El enlace de tu hoja de registro de horas de servicio es el siguiente: <a href="https://loquacious-eclair-9dba40.netlify.app/registro/${req.body.id}">https://loquacious-eclair-9dba40.netlify.app/registro/${req.body.id}</a>`
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

// Endpoint para poder enviar un correo para confirmar el reporte de ticket
app.post('/sendEmailConfirmReport', (req, res) => {
    const mailOptions = {
        from: 'capitalhumano.ideb@gmail.com',
        to: req.body.email_contacto,
        subject: 'Ahora puedes confirmar tu reporte',
        html: `Tu servicio esta disponible para que lo puedas confirmar, entra a este enlace para confirmar <a href="https://loquacious-eclair-9dba40.netlify.app/confirmar/${req.body.id}">aqui</a>`
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

// Endpoint para que los empleados puedan ver el ticket del cliente con todo el seguimiento que se le hizo 
app.post('/sendEmailConfirmTicket', (req, res) => {
    const mailOptions = {
        from: 'capitalhumano.ideb@gmail.com',
        to: 'technical.support@idebmexico.com',
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