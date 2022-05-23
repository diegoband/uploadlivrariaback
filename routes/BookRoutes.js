const router = require("express").Router();

const BookController = require("../controllers/BookController");

// midlewares books
const verifyToken = require("../helpers/verify-token");
const { imageUpload } = require("../helpers/image-upload");

router.post(
  "/create",
  verifyToken,
  imageUpload.array("images"),
  BookController.create
);

router.get("/", BookController.getAll);
router.get("/schoolbooks", verifyToken, BookController.getAllUserBooks);
router.get("/myadoptions", verifyToken, BookController.getAllUserAdoptions);
router.get("/:id", BookController.getBookById);
router.delete("/:id", verifyToken, BookController.removeBookById);
router.patch(
  "/:id",
  verifyToken,
  imageUpload.array("images"),
  BookController.updateBook
);
router.patch("/schedule/:id", verifyToken, BookController.schedule);
router.patch("/conclude/:id", verifyToken, BookController.concludeAdoption);
router.patch("/return/:id", verifyToken, BookController.returnAdoption);

module.exports = router;
