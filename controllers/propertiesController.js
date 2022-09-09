
const { asyncWrapper } = require("../middlewares/asyncWrapper");
const { Property } = require("../models/propertyModel");
const { statusCode } = require("./utils/statusCode");



const searchListings = asyncWrapper(async (req, res, next) => {
    console.log(req.body)
    const properties = await Property.find(req.body.query);
    return res.status(statusCode.OK).send({ message: "Success", response: properties })
})

const addNewListing = asyncWrapper(async (req, res, next) => {
    const newListing = new Property(req.body.property)
    await newListing.save()
    return res.status(statusCode.OK).send({message: "Success", response: newListing})
})

const removeListing = asyncWrapper(async (req, res, next) => {
    const property = await Property.findByIdAndDelete(req.body._id);
    return res.status(statusCode.OK).send({ message: "Success", response: property })
})

const updateListing = asyncWrapper(async (req, res, next) => {
    const property = await Property.findByIdAndUpdate(req.body._id, req.body.property, { new: true })
    return res.status(statusCode.OK).send({ message: "Success", response: property })
})


module.exports = {
    searchListings,
    addNewListing,
    removeListing,
    updateListing
}
