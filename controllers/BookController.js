const Book = require("../models/Book");

// helpers
const getUserByToken = require("../helpers/get-user-by-token");
const getToken = require("../helpers/get-token");
const ObjectId = require("mongoose").Types.ObjectId;

module.exports = class BookController {
  // create a book

  static async create(req, res) {
    const { name, age, weight, color, description } = req.body;
    const images = req.files;
    const available = true;

    // images upload

    // validation

    if (!name) {
      res.status(422).json({ message: "O nome é obrigatorio" });
      return;
    }
    if (!age) {
      res.status(422).json({ message: "O autor é obrigatorio" });
      return;
    }
    if (!weight) {
      res.status(422).json({ message: "O numero de paginas é obrigatorio" });
      return;
    }
    if (!color) {
      res.status(422).json({ message: "A catergoria é obrigatorio" });
      return;
    }
    if (!description) {
      res.status(422).json({ message: "A descriçao é obrigatorio" });
      return;
    }

    if (images.length === 0) {
      res.status(422).json({ message: "A imagem é obrigatória!" });
      return;
    }

    // get book owner

    const token = getToken(req);
    const user = await getUserByToken(token);

    // create a book

    const book = new Book({
      name,
      age,
      weight,
      color,
      available,
      description,
      images: [],
      user: {
        _id: user._id,
        name: user.name,
        image: user.image,
        phone: user.phone,
      },
    });

    images.map((image) => {
      book.images.push(image.filename);
    });

    try {
      const newBook = await book.save();
      res.status(201).json({
        message: "Livro cadastrado com sucesso",
        newBook,
      });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  }

  static async getAll(req, res) {
    const books = await Book.find().sort("-createAt");

    res.status(200).json({
      books: books,
    });
  }

  static async getAllUserBooks(req, res) {
    // get user from token
    const token = getToken(req);
    const user = await getUserByToken(token);

    const books = await Book.find({ "user._id": user._id }).sort("-creatAt");

    res.status(200).json({
      books,
    });
  }

  static async getAllUserAdoptions(req, res) {
    // get user from token
    const token = getToken(req);
    const user = await getUserByToken(token);

    const books = await Book.find({ "adopter._id": user._id }).sort(
      "-createAt"
    );

    res.status(200).json({
      books,
    });
  }

  static async getBookById(req, res) {
    const id = req.params.id;

    // check if id is valid
    if (!ObjectId.isValid(id)) {
      res.status(422).json({ message: "ID inválido!" });
      return;
    }

    // check if book exists
    const book = await Book.findOne({ _id: id });

    if (!book) {
      res.status(404).json({ message: "Livro não encontrado" });
      return;
    }

    res.status(200).json({
      book: book,
    });
  }

  static async removeBookById(req, res) {
    const id = req.params.id;

    // check if id is valid
    if (!ObjectId.isValid(id)) {
      res.status(422).json({ message: "ID inválido!" });
      return;
    }

    // check if book exists
    const book = await Book.findOne({ _id: id });

    if (!book) {
      res.status(404).json({ message: "Livro nao encontrado!" });
      return;
    }

    // check if logged is user registered the book
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (book.user._id.toString() !== user._id.toString()) {
      res.status(422).json({
        message:
          "Ouve um problema em processar sua solicitaçao tente mais tarde!",
      });
      return;
    }

    await Book.findByIdAndRemove(id);

    res.status(200).json({ message: "Livro removido com sucesso!" });
  }

  static async updateBook(req, res) {
    const id = req.params.id;

    const { name, age, weight, color, available, description } = req.body;

    const images = req.files;

    const updatedData = {};

    // check if book exists

    const book = await Book.findOne({ _id: id });

    if (!book) {
      res.status(404).json({ message: "Livro nao encontrado!" });
      return;
    }

    // check if logged in user registered the book
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (book.user._id.toString() !== user._id.toString()) {
      res.status(422).json({
        message:
          "Ouve um problema em processar a sua solicitaçao,tente novamente mais tarde!",
      });
      return;
    }

    // validation

    if (!name) {
      res.status(422).json({ message: "O nome é obrigatorio" });
      return;
    } else {
      updatedData.name = name;
    }
    if (!age) {
      res.status(422).json({ message: "O autor é obrigatorio" });
      return;
    } else {
      updatedData.age = age;
    }
    if (!weight) {
      res.status(422).json({ message: "O numero de paginas é obrigatorio" });
      return;
    } else {
      updatedData.weight = weight;
    }
    if (!color) {
      res.status(422).json({ message: "A categoria é obrigatorio" });
      return;
    } else {
      updatedData.color = color;
    }
    if (!description) {
      res.status(422).json({ message: "A descriçao é obrigatorio" });
      return;
    } else {
      updatedData.description = description;
    }

    if (images.length > 0) {
      updatedData.images = [];
      images.map((image) => {
        updatedData.images.push(image.filename);
      });
    }

    await Book.findByIdAndUpdate(id, updatedData);
    res.status(200).json({
      message: "Livro atualizado com sucesso!",
    });
  }

  static async schedule(req, res) {
    const id = req.params.id;

    // check if exists book

    const book = await Book.findOne({ _id: id });

    if (!book) {
      res.status(404).json({ message: "Livro nao encontrado!" });
      return;
    }

    // check user registered the book => para nao poder mecher no book que eu coloquei
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (book.user._id.equals(user._id)) {
      res.status(422).json({
        message: "Voce nao pode pegar um livro cadastrado por vc",
      });
      return;
    }

    // check if user already schedules a visit;
    if (book.adopter) {
      if (book.adopter._id.equals(user._id)) {
        res.status(422).json({
          message:
            "Voce ja solicitou este livro,se dirija a bilioteca Ebenezer!",
        });
        return;
      }
    }

    // add user to book
    book.adopter = {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      image: user.image,
      granted: false,
    };

    await Book.findByIdAndUpdate(id, book);

    res.status(200).json({
      message: `A solicitaçao de livro foi agendada com sucesso, entre em contato com ${book.user.name} pelo telefone ${book.user.phone}`,
    });
  }

  static async returnAdoption(req, res) {
    const id = req.params.id;

    const token = getToken(req);
    const user = await getUserByToken(token);

    // checck if exists
    const book = await Book.findOne({ _id: id });

    if (!book) {
      res.status(404).json({
        message: "Livro nao esta sendo encontrado!",
      });
      return;
    }

    // check logged in user registered the book

    book.adopter = {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      image: user.image,
      granted: true,
    };

    book.available = true;

    await Book.findByIdAndUpdate(id, book);

    res.status(200).json({
      message: "Obrigado por devolver o livro",
    });
  }

  static async concludeAdoption(req, res) {
    const id = req.params.id;

    // checck if exists
    const book = await Book.findOne({ _id: id });

    if (!book) {
      res.status(404).json({
        message: "Livro nao esta encontrado!",
      });
      return;
    }

    // check logged in user registered the book

    const token = getToken(req);
    const user = await getUserByToken(token);

    if (book.user._id.toString() !== user._id.toString()) {
      res.status(422).json({
        message:
          "Houve um problema em processar a sua solicitação, tente novamente mais tarde",
      });
      return;
    }

    book.adopter = {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      image: user.image,
      granted: true,
    };

    book.available = false;

    await Book.findByIdAndUpdate(id, book);

    res.status(200).json({
      message: "Parabens! O ciclo de solicitaçao foi finalizado com sucesso!",
    });
  }
};
