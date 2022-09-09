const express = require("express")
const router = express.Router()

// const agent = require("../controllers/agentController")
const { searchListings, addNewListing,
    removeListing, updateListing } = require('../controllers/propertiesController')


// router.patch("/updatedata", agent.updateAgentData)
// router.get("/find", agent.getAllAgents)
router.post("/add", addNewListing)
router.delete("/remove", removeListing)
router.get("/find", searchListings)
router.patch("/update", updateListing)
// router.post("/appointment/book", agent.bookAppointment)

module.exports = router;