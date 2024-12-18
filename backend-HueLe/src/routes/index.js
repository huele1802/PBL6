const account_Routes = require('./account_Routes')
const doctor_Routes = require('./doctor_Routes')
const speciality_Routes = require('./speciality_Routes')
const region_Routes = require('./region_Routes')
const appointment_Routes = require('./appointment_Routes')
const article_Routes = require('./article_Routes')
const post_Routes = require('./post_Routes')
const admin_access_Routes = require('./admin_access_Routes')

const express = require('express')
const path = require('path')

function routes(app){
    app.use('/acc', account_Routes)
    app.use('/doc', doctor_Routes)
    app.use('/special', speciality_Routes)
    app.use('/region', region_Routes)
    app.use('/appointment', appointment_Routes)
    app.use('/article', article_Routes)
    app.use('/post', post_Routes)
    app.use('/access', admin_access_Routes )
    app.use('/images', express.static(path.join(__dirname, '../../image')))
}

module.exports = routes