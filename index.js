(async()=>{
    "use strict";

    require("dotenv").config()

    // Dependencies
    const rateLimit = require("express-rate-limit")
    const { MongoClient } = require("mongodb")
    const compress = require("compression")
    const express = require("express")
    const helmet = require("helmet")
    const path = require("path")

    // Variables
    var leechKing = {
        accounts: {
            gaming: null,
            streaming: null,
            vpn: null,
            music: null,
            others: null
        }
    }

    const port = process.env.PORT || 8080
    const web = express()

    const client = new MongoClient(process.env.MONGODB_URL)
    const leechKingDB = client.db("leechKing")
    const gaming = leechKingDB.collection("gaming")
    const streaming = leechKingDB.collection("streaming")
    const vpn = leechKingDB.collection("vpn")
    const music = leechKingDB.collection("music")
    const others = leechKingDB.collection("others")

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 150,
        legacyHeaders: true
    })

    // Functions
    async function reloadDatabase(){
        leechKing.accounts.gaming = await gaming.find({}, { projection: { id: 0 } }).toArray()
        leechKing.accounts.streaming = await streaming.find({}, { projection: { id: 0 } }).toArray()
        leechKing.accounts.vpn = await vpn.find({}, { projection: { id: 0 } }).toArray()
        leechKing.accounts.music = await music.find({}, { projection: { id: 0 } }).toArray()
        leechKing.accounts.others = await others.find({}, { projection: { id: 0 } }).toArray()
    }

    /// Configurations
    // Express
    web.use(limiter)
    web.use(helmet({ contentSecurityPolicy: false }))
    web.set("view engine", "ejs")
    web.use(compress({ level: 1 }))

    // Main
    console.log("Connecting to the database, please wait.")
    await client.connect()
    console.log("Successfully connected to the database.")
        
    web.use(express.static(path.resolve(__dirname, "public")))
    web.get("/streaming", (req, res)=>res.render("streaming", { accounts: leechKing.accounts.streaming }))
    web.get("/gaming", (req, res)=>res.render("gaming", { accounts: leechKing.accounts.gaming }))
    web.get("/vpn", (req, res)=>res.render("vpn", { accounts: leechKing.accounts.vpn }))
    web.get("/music", (req, res)=>res.render("music", { accounts: leechKing.accounts.music }))
    web.get("/others", (req, res)=>res.render("others", { accounts: leechKing.accounts.others }))

    web.listen(port, async()=>{
        reloadDatabase()

        console.log(`Server is running. Port: ${port}`)

        setInterval(function(){
            reloadDatabase()
        }, 30 * 60 * 1000)
    })
})()