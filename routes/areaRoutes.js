const express = require("express");
const router = express.Router();
const areaController = require("../controllers/areaController");

router.get("/", areaController.getAreas);
router.get("/:id/topicos", areaController.getTopicosByArea);

module.exports = router;
